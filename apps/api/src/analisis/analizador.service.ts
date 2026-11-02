import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { type Esperar, esperar as esperarReal } from '../common/esperar';
import {
  LLM_PROVIDER,
  type LLMProvider,
  LLMRateLimitError,
  LLMTransitorioError,
} from '../llm/llm-provider';
import { LLM_RATE_LIMITER, RateLimiter } from '../llm/rate-limiter';
import {
  extraerJson,
  RespuestaInvalidaError,
  type ResultadoItem,
  validarLote,
} from './parsear-respuesta';
import { construirPrompt, type TranscripcionAAnalizar } from './prompt';

export const ESPERAR = Symbol('ESPERAR');

const MAX_INTENTOS_API = 5;
const MAX_INTENTOS_JSON = 2;

export interface ResultadoLote {
  resultados: Map<number, ResultadoItem>;
  fallidos: number[];
}

class ApiAgotadaError extends Error {
  constructor(
    message: string,
    readonly porCuota: boolean,
  ) {
    super(message);
  }
}

const combinar = (a: ResultadoLote, b: ResultadoLote): ResultadoLote => ({
  resultados: new Map([...a.resultados, ...b.resultados]),
  fallidos: [...a.fallidos, ...b.fallidos],
});

@Injectable()
export class AnalizadorService {
  private readonly logger = new Logger(AnalizadorService.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LLMProvider,
    @Inject(LLM_RATE_LIMITER) private readonly limiter: RateLimiter,
    @Optional()
    @Inject(ESPERAR)
    private readonly esperar: Esperar = esperarReal,
  ) {}

  get modelo() {
    return this.llm.modelo;
  }

  // Nunca lanza por respuestas malas del modelo: lo que no se pudo analizar vuelve en `fallidos`.
  // Solo propaga errores no recuperables (API key inválida, request mal formado).
  async analizarLote(items: TranscripcionAAnalizar[]): Promise<ResultadoLote> {
    const ids = items.map((item) => item.id);

    let json: unknown;
    try {
      json = await this.pedirJson(items);
    } catch (error) {
      if (!(error instanceof ApiAgotadaError)) throw error;
      this.logger.warn(
        `Lote [${ids.join(',')}] sin respuesta: ${error.message}`,
      );
      // Sin cuota, achicar el lote no ayuda. Un 500 persistente sí puede
      // deberse a un item puntual: se sigue abajo y el lote se divide.
      if (error.porCuota) return { resultados: new Map(), fallidos: ids };
      json = undefined;
    }

    const { validos, fallidos } =
      json === undefined
        ? { validos: new Map<number, ResultadoItem>(), fallidos: ids }
        : validarLote(json, ids);

    if (fallidos.length === 0) return { resultados: validos, fallidos };

    // Un lote de 1 que falla ya no se puede achicar más.
    if (items.length === 1) return { resultados: validos, fallidos };

    // Falló todo: probablemente el lote confundió al modelo, se prueba por mitades.
    if (fallidos.length === items.length) {
      const mitad = Math.ceil(items.length / 2);
      return combinar(
        await this.analizarLote(items.slice(0, mitad)),
        await this.analizarLote(items.slice(mitad)),
      );
    }

    // Fallaron algunos: se reenvían solo esos, en un lote más chico.
    const reintento = await this.analizarLote(
      items.filter((item) => fallidos.includes(item.id)),
    );
    return combinar({ resultados: validos, fallidos: [] }, reintento);
  }

  // Devuelve undefined si el modelo no entregó JSON parseable tras los reintentos.
  private async pedirJson(items: TranscripcionAAnalizar[]): Promise<unknown> {
    const prompt = construirPrompt(items);
    for (let intento = 1; intento <= MAX_INTENTOS_JSON; intento++) {
      const texto = await this.llamarConReintentos(prompt);
      try {
        return extraerJson(texto);
      } catch (error) {
        if (!(error instanceof RespuestaInvalidaError)) throw error;
        this.logger.warn(
          `JSON inválido (intento ${intento}): ${error.message}`,
        );
      }
    }
    return undefined;
  }

  private async llamarConReintentos(prompt: string): Promise<string> {
    for (let intento = 1; ; intento++) {
      await this.limiter.esperarTurno();
      try {
        const { texto } = await this.llm.generar(prompt);
        return texto;
      } catch (error) {
        const recuperable =
          error instanceof LLMRateLimitError ||
          error instanceof LLMTransitorioError;
        if (!recuperable) throw error;
        if (intento === MAX_INTENTOS_API) {
          throw new ApiAgotadaError(
            error.message,
            error instanceof LLMRateLimitError,
          );
        }
        const espera =
          (error instanceof LLMRateLimitError
            ? error.retryAfterMs
            : undefined) ?? 2000 * 2 ** (intento - 1) + Math.random() * 1000;
        this.logger.warn(
          `${error.message} · reintento ${intento}/${MAX_INTENTOS_API - 1} en ${Math.round(espera / 1000)}s`,
        );
        await this.esperar(espera);
      }
    }
  }
}
