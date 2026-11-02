import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type CargaCreada,
  type EstadoAnalisis,
  type EstadoCarga,
  MAX_FILAS_CARGA,
} from '@vambe/shared';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import type { Env } from '../config/env';
import { DRIZZLE, type Db } from '../db/db.module';
import { reuniones } from '../db/schema';
import { type FilaCsv, insertarFilas, parsearCsv } from '../ingesta/cargar-csv';
import { IngestaService } from '../ingesta/ingesta.service';

interface CargaEnCurso {
  desdeId: number;
  hastaId: number;
  iniciadaEn: Date;
  origen: 'csv' | 'reanudacion';
}

// Cargas de CSV desde la UI. Se procesan de a una para no competir por la cuota del LLM.
// El progreso vive en memoria: si el servidor se reinicia, las reuniones siguen
// 'pendiente' en la BD y reanudarPendientes() las retoma al arrancar.
@Injectable()
export class CargasService {
  private readonly logger = new Logger(CargasService.name);
  private actual: CargaEnCurso | null = null;
  private ocupado = false;

  get enProceso() {
    return this.ocupado;
  }

  // Tras vaciar la base, el progreso de la última carga ya no aplica.
  olvidarUltimaCarga() {
    this.actual = null;
  }

  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly ingesta: IngestaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async crear(contenido: string): Promise<CargaCreada> {
    if (this.ocupado) {
      throw new ConflictException(
        'Ya hay una carga en proceso: espera a que termine para subir otra.',
      );
    }

    let filas: FilaCsv[];
    try {
      filas = parsearCsv(contenido);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    if (filas.length === 0) {
      throw new BadRequestException('El CSV no tiene filas.');
    }
    if (filas.length > MAX_FILAS_CARGA) {
      throw new BadRequestException(
        `El CSV tiene ${filas.length} filas; el máximo por carga es ${MAX_FILAS_CARGA}.`,
      );
    }

    this.ocupado = true;
    let ids: number[];
    try {
      ids = await this.insertar(filas);
    } catch (error) {
      this.ocupado = false;
      throw error;
    }
    this.procesar(ids[0], ids[ids.length - 1], 'csv');
    return { total: ids.length };
  }

  async reanudarPendientes() {
    if (this.ocupado) return;
    const [rango] = await this.db
      .select({
        desde: sql<number | null>`min(${reuniones.id})`,
        hasta: sql<number | null>`max(${reuniones.id})`,
      })
      .from(reuniones)
      .where(eq(reuniones.estadoAnalisis, 'pendiente'));
    if (rango.desde === null || rango.hasta === null) return;

    this.logger.log(
      `Retomando reuniones pendientes (${rango.desde}-${rango.hasta})`,
    );
    this.ocupado = true;
    this.procesar(rango.desde, rango.hasta, 'reanudacion', ['pendiente']);
  }

  async estado(): Promise<EstadoCarga> {
    if (!this.actual) {
      return {
        estado: 'sin_cargas',
        total: 0,
        ok: 0,
        error: 0,
        pendientes: 0,
        origen: null,
        iniciadaEn: null,
        etaMin: null,
      };
    }

    const { desdeId, hastaId, iniciadaEn, origen } = this.actual;
    const [conteo] = await this.db
      .select({
        ok: sql<number>`(count(*) filter (where ${reuniones.estadoAnalisis} = 'ok'))::int`,
        error: sql<number>`(count(*) filter (where ${reuniones.estadoAnalisis} = 'error'))::int`,
        pendientes: sql<number>`(count(*) filter (where ${reuniones.estadoAnalisis} = 'pendiente'))::int`,
      })
      .from(reuniones)
      .where(and(gte(reuniones.id, desdeId), lte(reuniones.id, hastaId)));

    const procesadas = conteo.ok + conteo.error;
    const minutos = (Date.now() - iniciadaEn.getTime()) / 60_000;
    const porMinuto = minutos > 0 ? procesadas / minutos : 0;

    return {
      estado: this.ocupado ? 'procesando' : 'terminada',
      total: procesadas + conteo.pendientes,
      ...conteo,
      origen,
      iniciadaEn: iniciadaEn.toISOString(),
      etaMin:
        this.ocupado && porMinuto > 0
          ? Math.ceil(conteo.pendientes / porMinuto)
          : null,
    };
  }

  protected insertar(filas: FilaCsv[]): Promise<number[]> {
    return insertarFilas(this.db, filas);
  }

  private procesar(
    desdeId: number,
    hastaId: number,
    origen: CargaEnCurso['origen'],
    estados?: EstadoAnalisis[],
  ) {
    this.actual = { desdeId, hastaId, iniciadaEn: new Date(), origen };
    this.ingesta
      .ejecutar({
        desdeId,
        hastaId,
        estados,
        batch: this.config.get('INGESTA_BATCH_SIZE'),
        concurrencia: this.config.get('INGESTA_CONCURRENCIA'),
      })
      .catch((error: Error) =>
        this.logger.error(`La carga falló: ${error.message}`, error.stack),
      )
      .finally(() => {
        this.ocupado = false;
      });
  }
}
