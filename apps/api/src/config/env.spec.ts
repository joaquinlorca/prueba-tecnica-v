// test
import { validarEnv } from './env';

const envValido = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/postgres',
  GEMINI_API_KEY: 'clave',
  GEMINI_MODEL: 'gemma-modelo',
};

describe('validarEnv', () => {
  it('acepta un env válido y aplica los valores por defecto', () => {
    expect(validarEnv(envValido)).toEqual({
      ...envValido,
      PORT: 3001,
      LLM_RPM: 4,
      INGESTA_BATCH_SIZE: 15,
      INGESTA_CONCURRENCIA: 4,
      CORS_ORIGIN: ['http://localhost:3000'],
    });
  });

  it('convierte PORT a número', () => {
    expect(validarEnv({ ...envValido, PORT: '8080' }).PORT).toBe(8080);
  });

  it('acepta varios orígenes de CORS separados por coma', () => {
    expect(
      validarEnv({
        ...envValido,
        CORS_ORIGIN: 'http://localhost:3000, https://front.example.com',
      }).CORS_ORIGIN,                                                    // cambiar front.example.com por el de vercel.
    ).toEqual(['http://localhost:3000', 'https://front.example.com']);
  });

  it('falla si falta DATABASE_URL', () => {
    const { DATABASE_URL: _omitida, ...sinUrl } = envValido;
    expect(() => validarEnv(sinUrl)).toThrow(/DATABASE_URL/);
  });

  it('falla si DATABASE_URL no es una URL', () => {
    expect(() =>
      validarEnv({ ...envValido, DATABASE_URL: 'no-es-url' }),
    ).toThrow(/DATABASE_URL/);
  });
});
