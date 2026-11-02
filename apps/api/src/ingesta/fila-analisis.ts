import type { DimensionCategoria } from '@vambe/shared';
import type { ResultadoItem } from '../analisis/parsear-respuesta';
import { PROMPT_VERSION } from '../analisis/prompt';
import type { analisisReuniones } from '../db/schema';

// Clave "dimension:nombre" → id en la tabla categorias.
export type MapaCategorias = Map<string, number>;

const idCategoria = (
  categorias: MapaCategorias,
  dimension: DimensionCategoria,
  nombre: string,
) => {
  const id = categorias.get(`${dimension}:${nombre}`);
  if (id === undefined) {
    throw new Error(
      `Categoría ${dimension}:${nombre} no existe en la BD (¿falta correr el seed?)`,
    );
  }
  return id;
};

export const filaAnalisis = (
  reunionId: number,
  { analisis, crudo }: ResultadoItem,
  categorias: MapaCategorias,
  modelo: string,
): typeof analisisReuniones.$inferInsert => ({
  reunionId,
  industriaId: idCategoria(categorias, 'industria', analisis.industria),
  canalAdquisicionId: idCategoria(
    categorias,
    'canal_adquisicion',
    analisis.canal_adquisicion,
  ),
  dolorPrincipalId: idCategoria(
    categorias,
    'dolor_principal',
    analisis.dolor_principal,
  ),
  tamanoEmpresa: analisis.tamano_empresa,
  volumenMensual: analisis.volumen_mensual,
  casosUso: analisis.casos_uso,
  integraciones: analisis.integraciones,
  canalesAtencion: analisis.canales_atencion,
  respuestaCruda: { prompt_version: PROMPT_VERSION, modelo, item: crudo },
});
