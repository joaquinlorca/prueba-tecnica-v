import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  type LLMProvider,
  LLMRateLimitError,
  LLMTransitorioError,
  type RespuestaLLM,
} from './llm-provider';

const TIMEOUT_MS = 120_000;

// Traduce los errores del SDK a los errores que entiende el AnalizadorService.
export const clasificarError = (error: unknown): unknown => {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      const segundos = /"retryDelay":\s*"(\d+(?:\.\d+)?)s"/.exec(
        error.message,
      )?.[1];
      return new LLMRateLimitError(
        'Rate limit de Gemini (429)',
        segundos ? Number(segundos) * 1000 : undefined,
      );
    }
    if (error.status >= 500) {
      return new LLMTransitorioError(`Error ${error.status} de Gemini`);
    }
    return error;
  }
  // Errores de red o timeout: no traen status HTTP.
  const mensaje = error instanceof Error ? error.message : String(error);
  return new LLMTransitorioError(`Error de red con Gemini: ${mensaje}`);
};

export class GeminiProvider implements LLMProvider {
  private readonly cliente: GoogleGenAI;

  constructor(
    apiKey: string,
    readonly modelo: string,
  ) {
    this.cliente = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: TIMEOUT_MS },
    });
  }

  async generar(prompt: string): Promise<RespuestaLLM> {
    try {
      const respuesta = await this.cliente.models.generateContent({
        model: this.modelo,
        // Gemma no soporta system instruction: todo el prompt va como mensaje de usuario.
        contents: prompt,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          // Sin esto Gemma 4 "piensa" ~1000 tokens por transcripción y tarda 6 veces más.
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
      return {
        texto: respuesta.text ?? '',
        tokensEntrada: respuesta.usageMetadata?.promptTokenCount,
        tokensSalida: respuesta.usageMetadata?.candidatesTokenCount,
      };
    } catch (error) {
      throw clasificarError(error);
    }
  }
}
