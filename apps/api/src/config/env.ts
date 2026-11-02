import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  // Free tier de Gemma 4: 30 RPM pero 16k TPM. Un lote de 15 usa ~3.400 tokens de entrada,
  // así que el límite real son ~4 req/min.
  LLM_RPM: z.coerce.number().positive().default(4),
  INGESTA_BATCH_SIZE: z.coerce.number().int().positive().default(15),
  // Cada lote tarda ~40 s en responder: sin paralelismo no se alcanza el RPM.
  INGESTA_CONCURRENCIA: z.coerce.number().int().positive().default(4),
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
