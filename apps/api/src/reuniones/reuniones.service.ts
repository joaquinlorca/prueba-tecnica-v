import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Analisis,
  CanalAdquisicion,
  Catalogos,
  DolorPrincipal,
  Industria,
  Listado,
  Paginado,
  ReunionDetalle,
  ReunionResumen,
} from '@vambe/shared';
import { asc, count, desc, eq, sql } from 'drizzle-orm';
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

const LARGO_EXTRACTO = 160;

const camposReunion = {
  id: reuniones.id,
  cliente: clientes.nombre,
  email: clientes.email,
  telefono: clientes.telefono,
  vendedor: vendedores.nombre,
  fecha: reuniones.fecha,
  closed: reuniones.closed,
  estadoAnalisis: reuniones.estadoAnalisis,
  industria: catIndustria.nombre,
  canal: catCanal.nombre,
  dolor: catDolor.nombre,
  tamanoEmpresa: analisisReuniones.tamanoEmpresa,
  volumenMensual: analisisReuniones.volumenMensual,
  casosUso: analisisReuniones.casosUso,
  integraciones: analisisReuniones.integraciones,
  canalesAtencion: analisisReuniones.canalesAtencion,
  transcripcion: reuniones.transcripcion,
  promptVersion: sql<
    string | null
  >`${analisisReuniones.respuestaCruda}->>'prompt_version'`,
  modelo: sql<string | null>`${analisisReuniones.respuestaCruda}->>'modelo'`,
};

type FilaReunion = {
  industria: string | null;
  canal: string | null;
  dolor: string | null;
  tamanoEmpresa: Analisis['tamano_empresa'];
  volumenMensual: number | null;
  casosUso: Analisis['casos_uso'] | null;
  integraciones: Analisis['integraciones'] | null;
  canalesAtencion: Analisis['canales_atencion'] | null;
};

// Sin fila en analisis_reuniones (pendiente o error) el análisis es null.
const aAnalisis = (fila: FilaReunion): Analisis | null =>
  fila.industria === null
    ? null
    : {
        industria: fila.industria as Industria,
        canal_adquisicion: fila.canal as CanalAdquisicion,
        dolor_principal: fila.dolor as DolorPrincipal,
        tamano_empresa: fila.tamanoEmpresa,
        volumen_mensual: fila.volumenMensual,
        casos_uso: fila.casosUso ?? [],
        integraciones: fila.integraciones ?? [],
        canales_atencion: fila.canalesAtencion ?? [],
      };

const ORDEN = {
  fecha_desc: [desc(reuniones.fecha), desc(reuniones.id)],
  fecha_asc: [asc(reuniones.fecha), asc(reuniones.id)],
  volumen_desc: [
    sql`${analisisReuniones.volumenMensual} desc nulls last`,
    desc(reuniones.id),
  ],
};

@Injectable()
export class ReunionesService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  async listar(listado: Listado): Promise<Paginado<ReunionResumen>> {
    const where = construirWhere(listado);
    const { page, pageSize } = listado;

    const [filas, [{ total }]] = await Promise.all([
      this.consulta()
        .where(where)
        .orderBy(...ORDEN[listado.orden])
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ total: count() })
        .from(reuniones)
        .innerJoin(clientes, joinCliente)
        .leftJoin(analisisReuniones, joinAnalisis)
        .where(where),
    ]);

    return {
      items: filas.map((fila) => ({
        id: fila.id,
        cliente: fila.cliente,
        email: fila.email,
        vendedor: fila.vendedor,
        fecha: fila.fecha,
        closed: fila.closed,
        estadoAnalisis: fila.estadoAnalisis,
        analisis: aAnalisis(fila),
        extracto: fila.transcripcion.slice(0, LARGO_EXTRACTO),
      })),
      total,
      page,
      pageSize,
    };
  }

  async detalle(id: number): Promise<ReunionDetalle> {
    const [fila] = await this.consulta().where(eq(reuniones.id, id));

    if (!fila) throw new NotFoundException(`No existe la reunión ${id}`);

    return {
      id: fila.id,
      cliente: fila.cliente,
      email: fila.email,
      telefono: fila.telefono,
      vendedor: fila.vendedor,
      fecha: fila.fecha,
      closed: fila.closed,
      estadoAnalisis: fila.estadoAnalisis,
      analisis: aAnalisis(fila),
      transcripcion: fila.transcripcion,
      promptVersion: fila.promptVersion,
      modelo: fila.modelo,
    };
  }

  async catalogos(): Promise<Catalogos> {
    const lista = await this.db
      .select({ id: vendedores.id, nombre: vendedores.nombre })
      .from(vendedores)
      .orderBy(asc(vendedores.nombre));
    return { vendedores: lista };
  }

  private consulta() {
    return this.db
      .select(camposReunion)
      .from(reuniones)
      .innerJoin(clientes, joinCliente)
      .innerJoin(vendedores, joinVendedor)
      .leftJoin(analisisReuniones, joinAnalisis)
      .leftJoin(catIndustria, joinIndustria)
      .leftJoin(catCanal, joinCanal)
      .leftJoin(catDolor, joinDolor);
  }
}
