// test
import {
  type LLMProvider,
  LLMRateLimitError,
  LLMTransitorioError,
  type RespuestaLLM,
} from '../llm/llm-provider';
import { RateLimiter } from '../llm/rate-limiter';
import { AnalizadorService } from './analizador.service';
import type { TranscripcionAAnalizar } from './prompt';

const item = (id: number) => ({
  id,
  industria: 'salud',
  canal_adquisicion: 'recomendacion',
  dolor_principal: 'equipo_saturado',
  tamano_empresa: null,
  volumen: null,
  casos_uso: [],
  integraciones: [],
  canales_atencion: [],
});

const transcripciones = (...ids: number[]): TranscripcionAAnalizar[] =>
  ids.map((id) => ({ id, transcripcion: `transcripción ${id}` }));

// Responde según una función que recibe los ids pedidos en cada prompt.
class FakeLLM implements LLMProvider {
  readonly modelo = 'fake';
  readonly llamadas: number[][] = [];

  constructor(private readonly responder: (ids: number[]) => string | Error) {}

  generar(prompt: string): Promise<RespuestaLLM> {
    const ids = [...prompt.matchAll(/<t id="(\d+)">/g)]
      .map((m) => Number(m[1]))
      .filter((id) => id !== 0); // el id 0 es el del ejemplo del prompt
    this.llamadas.push(ids);
    const respuesta = this.responder(ids);
    return respuesta instanceof Error
      ? Promise.reject(respuesta)
      : Promise.resolve({ texto: respuesta });
  }
}

const crear = (llm: FakeLLM) => {
  const esperas: number[] = [];
  const esperar = (ms: number) => {
    esperas.push(ms);
    return Promise.resolve();
  };
  const servicio = new AnalizadorService(
    llm,
    new RateLimiter(60_000, () => Promise.resolve()),
    esperar,
  );
  return { servicio, esperas };
};

describe('AnalizadorService.analizarLote', () => {
  it('analiza todo el lote en una sola llamada', async () => {
    const llm = new FakeLLM((ids) => JSON.stringify(ids.map(item)));
    const { servicio } = crear(llm);

    const { resultados, fallidos } = await servicio.analizarLote(
      transcripciones(1, 2, 3),
    );

    expect([...resultados.keys()]).toEqual([1, 2, 3]);
    expect(fallidos).toEqual([]);
    expect(llm.llamadas).toEqual([[1, 2, 3]]);
  });

  it('si el JSON es inválido dos veces, divide el lote en mitades', async () => {
    const llm = new FakeLLM((ids) =>
      ids.length > 2 ? 'esto no es json' : JSON.stringify(ids.map(item)),
    );
    const { servicio } = crear(llm);

    const { resultados, fallidos } = await servicio.analizarLote(
      transcripciones(1, 2, 3, 4),
    );

    expect([...resultados.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(fallidos).toEqual([]);
    expect(llm.llamadas).toEqual([
      [1, 2, 3, 4],
      [1, 2, 3, 4],
      [1, 2],
      [3, 4],
    ]);
  });

  it('reenvía solo los ids que faltaron en la respuesta', async () => {
    const llm = new FakeLLM((ids) =>
      JSON.stringify(
        ids.filter((id) => id !== 2 || ids.length === 1).map(item),
      ),
    );
    const { servicio } = crear(llm);

    const { resultados, fallidos } = await servicio.analizarLote(
      transcripciones(1, 2, 3),
    );

    expect([...resultados.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(fallidos).toEqual([]);
    expect(llm.llamadas).toEqual([[1, 2, 3], [2]]);
  });

  it('un item que siempre falla queda como fallido sin afectar al resto', async () => {
    const llm = new FakeLLM((ids) =>
      JSON.stringify(
        ids.map((id) =>
          id === 2 ? { ...item(id), industria: 'mineria' } : item(id),
        ),
      ),
    );
    const { servicio } = crear(llm);

    const { resultados, fallidos } = await servicio.analizarLote(
      transcripciones(1, 2, 3),
    );

    expect([...resultados.keys()].sort((a, b) => a - b)).toEqual([1, 3]);
    expect(fallidos).toEqual([2]);
  });

  it('si el dolor sigue inválido tras los reintentos, se guarda como "otro"', async () => {
    const llm = new FakeLLM((ids) =>
      JSON.stringify(
        ids.map((id) =>
          id === 2
            ? { ...item(id), dolor_principal: 'agendamiento' }
            : item(id),
        ),
      ),
    );
    const { servicio } = crear(llm);

    const { resultados, fallidos } = await servicio.analizarLote(
      transcripciones(1, 2, 3),
    );

    expect(fallidos).toEqual([]);
    expect(resultados.get(2)?.analisis.dolor_principal).toBe('otro');
    // Primero se reintentó solo el item 2; el rescate es el último recurso.
    expect(llm.llamadas).toEqual([[1, 2, 3], [2]]);
  });

  it('ante un 429 espera el retryAfter que indica la API y reintenta', async () => {
    let primera = true;
    const llm = new FakeLLM((ids) => {
      if (primera) {
        primera = false;
        return new LLMRateLimitError('cuota', 7000);
      }
      return JSON.stringify(ids.map(item));
    });
    const { servicio, esperas } = crear(llm);

    const { fallidos } = await servicio.analizarLote(transcripciones(1));

    expect(fallidos).toEqual([]);
    expect(esperas).toEqual([7000]);
  });

  it('si la cuota se agota en todos los intentos, el lote completo queda fallido sin dividirse', async () => {
    const llm = new FakeLLM(() => new LLMRateLimitError('429'));
    const { servicio, esperas } = crear(llm);

    const { resultados, fallidos } = await servicio.analizarLote(
      transcripciones(1, 2),
    );

    expect(resultados.size).toBe(0);
    expect(fallidos).toEqual([1, 2]);
    expect(llm.llamadas).toHaveLength(5);
    expect(esperas).toHaveLength(4);
  });

  it('si un item provoca 500 persistentes, divide el lote y salva al resto', async () => {
    const llm = new FakeLLM((ids) =>
      ids.includes(2)
        ? new LLMTransitorioError('500')
        : JSON.stringify(ids.map(item)),
    );
    const { servicio } = crear(llm);

    const { resultados, fallidos } = await servicio.analizarLote(
      transcripciones(1, 2, 3),
    );

    expect([...resultados.keys()].sort((a, b) => a - b)).toEqual([1, 3]);
    expect(fallidos).toEqual([2]);
  });

  it('propaga errores no recuperables (ej. API key inválida)', async () => {
    const llm = new FakeLLM(() => new Error('API key not valid'));
    const { servicio } = crear(llm);

    await expect(servicio.analizarLote(transcripciones(1))).rejects.toThrow(
      'API key not valid',
    );
  });
});
