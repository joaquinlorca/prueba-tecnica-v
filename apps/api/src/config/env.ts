import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
});
export type Env = z.infer<typeof EnvSchema>;

export const validarEnv = (env: Record<string, unknown>): Env => {
  const resultado = EnvSchema.safeParse(env);
  if (!resultado.success) {
    throw new Error(
      `Variables de entorno inválidas:\n${z.prettifyError(resultado.error)}`,
    );
  }
  return resultado.data;
};
