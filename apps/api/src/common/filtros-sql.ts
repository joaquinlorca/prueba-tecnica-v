import type { DimensionCategoria, Filtros } from '@vambe/shared';
import {
  and,
  arrayOverlaps,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { analisisReuniones, clientes, reuniones } from '../db/schema';

const porCategoria = (
  columna: PgColumn,
  dimension: DimensionCategoria,
  nombres: string[],
) =>
  sql`${columna} in (select id from categorias where dimension = ${dimension} and nombre in ${nombres})`;

const escaparLike = (texto: string) =>
  texto.replace(/[\\%_]/g, (c) => `\\${c}`);

// Traduce los filtros a SQL. Asume una consulta sobre reuniones con join a
// clientes y left join a analisis_reuniones. Mismo filtro = mismo resultado
// en el listado y en las métricas.
export const construirWhere = (filtros: Filtros): SQL | undefined => {
  const busqueda = filtros.q ? `%${escaparLike(filtros.q)}%` : undefined;
  const cliente = filtros.cliente
    ? `%${escaparLike(filtros.cliente)}%`
    : undefined;

  return and(
    busqueda
      ? or(
          ilike(clientes.nombre, busqueda),
          ilike(clientes.email, busqueda),
          ilike(reuniones.transcripcion, busqueda),
        )
      : undefined,
    cliente
      ? or(ilike(clientes.nombre, cliente), ilike(clientes.email, cliente))
      : undefined,
    filtros.closed !== undefined
      ? eq(reuniones.closed, filtros.closed)
      : undefined,
    filtros.vendedor
      ? inArray(reuniones.vendedorId, filtros.vendedor)
      : undefined,
    filtros.desde ? gte(reuniones.fecha, filtros.desde) : undefined,
    filtros.hasta ? lte(reuniones.fecha, filtros.hasta) : undefined,
    filtros.industria
      ? porCategoria(
          analisisReuniones.industriaId,
          'industria',
          filtros.industria,
        )
      : undefined,
    filtros.canal
      ? porCategoria(
          analisisReuniones.canalAdquisicionId,
          'canal_adquisicion',
          filtros.canal,
        )
      : undefined,
    filtros.dolor
      ? porCategoria(
          analisisReuniones.dolorPrincipalId,
          'dolor_principal',
          filtros.dolor,
        )
      : undefined,
    filtros.tamano
      ? inArray(analisisReuniones.tamanoEmpresa, filtros.tamano)
      : undefined,
    filtros.casoUso
      ? arrayOverlaps(analisisReuniones.casosUso, filtros.casoUso)
      : undefined,
    filtros.integracion
      ? arrayOverlaps(analisisReuniones.integraciones, filtros.integracion)
      : undefined,
    filtros.canalAtencion
      ? arrayOverlaps(analisisReuniones.canalesAtencion, filtros.canalAtencion)
      : undefined,
  );
};
