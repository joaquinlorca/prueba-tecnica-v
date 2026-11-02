import { Inject, Injectable } from '@nestjs/common';
import {
  type CampoDemanda,
  type CierrePorDimension,
  type Demanda,
  type DimensionCierre,
  type Filtros,
  type Industria,
  type PuntoTendencia,
  type RendimientoVendedores,
  type ResumenMetricas,
  type Segmentacion,
  TRAMOS_VOLUMEN,
} from '@vambe/shared';
import { and, eq, type SQL, sql } from 'drizzle-orm';
import {
  catCanal,
  catDolor,
  catIndustria,
  joinAnalisis,
  joinCanal,
  joinCliente,
  joinDolor,
  joinIndustria,
  joinVendedor,
} from '../common/consulta-base';
import { construirWhere } from '../common/filtros-sql';
import { DRIZZLE, type Db } from '../db/db.module';
import {
  analisisReuniones,
  clientes,
  reuniones,
  vendedores,
} from '../db/schema';
import { type Agregado, segmentar } from './segmentar';

const n = sql<number>`count(*)::int`;
const cerradas = sql<number>`(count(*) filter (where ${reuniones.closed}))::int`;

const soloAnalizadas = eq(reuniones.estadoAnalisis, 'ok');

const CLAVE_POR_DIMENSION: Record<DimensionCierre, SQL<string>> = {
  industria: sql`${catIndustria.nombre}`,
  canal_adquisicion: sql`${catCanal.nombre}`,
  dolor_principal: sql`${catDolor.nombre}`,
  tamano_empresa: sql`coalesce(${analisisReuniones.tamanoEmpresa}, 'sin_dato')`,
  vendedor: sql`${vendedores.nombre}`,
};

const TRAMO_VOLUMEN = sql<string>`case
  when ${analisisReuniones.volumenMensual} is null then 'sin_dato'
  when ${analisisReuniones.volumenMensual} < 500 then '<500'
  when ${analisisReuniones.volumenMensual} < 2000 then '500-2k'
  when ${analisisReuniones.volumenMensual} < 10000 then '2k-10k'
  else '>10k' end`;

const COLUMNA_DEMANDA = {
  casos_uso: analisisReuniones.casosUso,
  integraciones: analisisReuniones.integraciones,
  canales_atencion: analisisReuniones.canalesAtencion,
};

@Injectable()
export class MetricasService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  async resumen(filtros: Filtros): Promise<ResumenMetricas> {
    const [fila] = await this.db
      .select({
        total: n,
        cerradas,
        analizadas: sql<number>`(count(*) filter (where ${soloAnalizadas}))::int`,
        pendientes: sql<number>`(count(*) filter (where ${reuniones.estadoAnalisis} = 'pendiente'))::int`,
        errores: sql<number>`(count(*) filter (where ${reuniones.estadoAnalisis} = 'error'))::int`,
        medianaVolumen: sql<
          number | null
        >`percentile_cont(0.5) within group (order by ${analisisReuniones.volumenMensual})::int`,
        fechaMin: sql<string | null>`min(${reuniones.fecha})::text`,
        fechaMax: sql<string | null>`max(${reuniones.fecha})::text`,
      })
      .from(reuniones)
      .innerJoin(clientes, joinCliente)
      .leftJoin(analisisReuniones, joinAnalisis)
      .where(construirWhere(filtros));

    return {
      ...fila,
      tasaCierre: fila.total > 0 ? fila.cerradas / fila.total : null,
    };
  }

  // Por vendedor se usan todas las reuniones; por categorías del análisis, solo las analizadas.
  async cierre(
    dimension: DimensionCierre,
    filtros: Filtros,
  ): Promise<CierrePorDimension> {
    const filas = await this.agregar(
      CLAVE_POR_DIMENSION[dimension],
      dimension === 'vendedor'
        ? construirWhere(filtros)
        : and(soloAnalizadas, construirWhere(filtros)),
    );
    return { dimension, ...segmentar(filas) };
  }

  async volumen(filtros: Filtros): Promise<Segmentacion> {
    const filas = await this.agregar(
      TRAMO_VOLUMEN,
      and(soloAnalizadas, construirWhere(filtros)),
    );
    const orden = (clave: string) =>
      TRAMOS_VOLUMEN.indexOf(clave as (typeof TRAMOS_VOLUMEN)[number]);
    return segmentar(filas.sort((a, b) => orden(a.clave) - orden(b.clave)));
  }

  async vendedores(filtros: Filtros): Promise<RendimientoVendedores> {
    const [ranking, celdas] = await Promise.all([
      this.cierre('vendedor', filtros),
      this.db
        .select({
          vendedor: vendedores.nombre,
          industria: sql<Industria>`${catIndustria.nombre}`,
          n,
          cerradas,
        })
        .from(reuniones)
        .innerJoin(clientes, joinCliente)
        .innerJoin(vendedores, joinVendedor)
        .leftJoin(analisisReuniones, joinAnalisis)
        .leftJoin(catIndustria, joinIndustria)
        .where(and(soloAnalizadas, construirWhere(filtros)))
        .groupBy(vendedores.nombre, catIndustria.nombre),
    ]);

    return {
      tasaBase: ranking.tasaBase,
      segmentos: ranking.segmentos,
      celdas: celdas.map(({ cerradas: c, ...celda }) => ({
        ...celda,
        tasa: c / celda.n,
      })),
    };
  }

  async demanda(campo: CampoDemanda, filtros: Filtros): Promise<Demanda> {
    const where = and(soloAnalizadas, construirWhere(filtros));
    const [[base], filas] = await Promise.all([
      this.db
        .select({ n, cerradas })
        .from(reuniones)
        .innerJoin(clientes, joinCliente)
        .leftJoin(analisisReuniones, joinAnalisis)
        .where(where),
      this.db.execute<Agregado & Record<string, unknown>>(sql`
        select valor as clave, ${n} as n, ${cerradas} as cerradas
        from ${reuniones}
        inner join ${clientes} on ${joinCliente}
        left join ${analisisReuniones} on ${joinAnalisis}
        cross join lateral unnest(${COLUMNA_DEMANDA[campo]}) as valor
        where ${where}
        group by valor
        order by n desc`),
    ]);

    const analizadas = base?.n ?? 0;
    return {
      campo,
      analizadas,
      tasaBase: analizadas > 0 ? base.cerradas / analizadas : null,
      items: [...filas].map((fila) => ({
        clave: fila.clave,
        n: fila.n,
        pctReuniones: fila.n / analizadas,
        tasaCierre: fila.cerradas / fila.n,
      })),
    };
  }

  async tendencia(filtros: Filtros): Promise<PuntoTendencia[]> {
    const mes = sql<string>`to_char(date_trunc('month', ${reuniones.fecha}), 'YYYY-MM')`;
    const filas = await this.agregar(mes, construirWhere(filtros));
    return filas
      .map(({ clave, n: total, cerradas: c }) => ({
        mes: clave,
        n: total,
        tasa: c / total,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  // count y closed agrupados por `clave`, con todos los joins que pueden necesitar la clave o los filtros.
  private agregar(clave: SQL<string>, where: SQL | undefined) {
    return this.db
      .select({ clave, n, cerradas })
      .from(reuniones)
      .innerJoin(clientes, joinCliente)
      .innerJoin(vendedores, joinVendedor)
      .leftJoin(analisisReuniones, joinAnalisis)
      .leftJoin(catIndustria, joinIndustria)
      .leftJoin(catCanal, joinCanal)
      .leftJoin(catDolor, joinDolor)
      .where(where)
      .groupBy(clave)
      .orderBy(sql`count(*) desc`);
  }
}
