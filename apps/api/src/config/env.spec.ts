// test
import { validarEnv } from './env';

const envValido = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/postgres',
  GEMINI_API_KEY: 'clave',
  GEMINI_MODEL: 'gemma-modelo',
};

describe('validarEnv', () => {
  it('acepta un env válido y usa 3001 como puerto por defecto', () => {
    expect(validarEnv(envValido)).toEqual({ ...envValido, PORT: 3001 });
  });

  it('convierte PORT a número', () => {
    expect(validarEnv({ ...envValido, PORT: '8080' }).PORT).toBe(8080);
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
