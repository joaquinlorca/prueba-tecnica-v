export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface RespuestaLLM {
  texto: string;
  tokensEntrada?: number;
  tokensSalida?: number;
}

// unica perta de entrada a un modelo: cambiar de LLM = otra implementación de esta interfaz.
export interface LLMProvider {
  readonly modelo: string;
  generar(prompt: string): Promise<RespuestaLLM>;
}

export class LLMRateLimitError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

export class LLMTransitorioError extends Error {}
