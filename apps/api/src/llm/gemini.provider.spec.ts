// test
import { ApiError } from '@google/genai';
import { clasificarError } from './gemini.provider';
import { LLMRateLimitError, LLMTransitorioError } from './llm-provider';

describe('clasificarError', () => {
  it('un 429 es rate limit y lee el retryDelay que manda Google', () => {
    const error = clasificarError(
      new ApiError({
        status: 429,
        message:
          '{"error":{"code":429,"details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"23s"}]}}',
      }),
    );
    expect(error).toBeInstanceOf(LLMRateLimitError);
    expect((error as LLMRateLimitError).retryAfterMs).toBe(23_000);
  });

  it('un 429 sin retryDelay deja que el servicio decida la espera', () => {
    const error = clasificarError(
      new ApiError({ status: 429, message: 'quota' }),
    );
    expect((error as LLMRateLimitError).retryAfterMs).toBeUndefined();
  });

  it.each([500, 503, 504])('un %i es transitorio', (status) => {
    expect(
      clasificarError(new ApiError({ status, message: 'x' })),
    ).toBeInstanceOf(LLMTransitorioError);
  });

  it('un error de red o timeout es transitorio', () => {
    expect(clasificarError(new TypeError('fetch failed'))).toBeInstanceOf(
      LLMTransitorioError,
    );
  });

  it('un 400 o 403 se devuelve tal cual (no se reintenta)', () => {
    const original = new ApiError({
      status: 400,
      message: 'API key not valid',
    });
    expect(clasificarError(original)).toBe(original);
  });
});
