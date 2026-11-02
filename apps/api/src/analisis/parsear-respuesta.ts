import {
  type Analisis,
  AnalisisLLMItemSchema,
  normalizarAnalisis,
} from '@vambe/shared';

export class RespuestaInvalidaError extends Error {}

export interface ResultadoItem {
  analisis: Analisis;
  crudo: unknown;
}

// Tolera fences de markdown y texto antes o después del JSON.
export const extraerJson = (texto: string): unknown => {
  const inicio = texto.search(/[[{]/);
  const fin = Math.max(texto.lastIndexOf(']'), texto.lastIndexOf('}'));
  if (inicio === -1 || fin < inicio) {
    throw new RespuestaInvalidaError('La respuesta no contiene JSON');
  }
  try {
    return JSON.parse(texto.slice(inicio, fin + 1));
  } catch {
    throw new RespuestaInvalidaError('La respuesta contiene JSON mal formado');
  }
};

// Último recurso cuando el modelo insiste en un dolor fuera de la taxonomía
// (p. ej. un caso de uso como "agendamiento"): se guarda como "otro" en vez de
// perder la reunión. La respuesta original queda en `crudo`.
const conDolorRescatado = (crudo: unknown) =>
  typeof crudo === 'object' && crudo !== null
    ? AnalisisLLMItemSchema.safeParse({ ...crudo, dolor_principal: 'otro' })
    : undefined;

// Valida item por item: un item malo no invalida al resto del lote.
export const validarLote = (
  json: unknown,
  idsEsperados: number[],
  { rescatarDolor = false }: { rescatarDolor?: boolean } = {},
) => {
  const esperados = new Set(idsEsperados);
  const validos = new Map<number, ResultadoItem>();

  for (const crudo of Array.isArray(json) ? json : []) {
    let resultado = AnalisisLLMItemSchema.safeParse(crudo);
    if (!resultado.success && rescatarDolor) {
      resultado = conDolorRescatado(crudo) ?? resultado;
    }
    if (!resultado.success) continue;
    const { id } = resultado.data;
    if (!esperados.has(id) || validos.has(id)) continue;
    validos.set(id, { analisis: normalizarAnalisis(resultado.data), crudo });
  }

  const fallidos = idsEsperados.filter((id) => !validos.has(id));
  return { validos, fallidos };
};
