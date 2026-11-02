import { Inject, Injectable, Logger } from '@nestjs/common';
import type { EstadoAnalisis } from '@vambe/shared';
import { and, asc, gte, inArray, lte, sql } from 'drizzle-orm';
import {
  AnalizadorService,
  type ResultadoLote,
} from '../analisis/analizador.service';
import { dividirEnLotes } from '../common/dividir-en-lotes';
import { DRIZZLE, type Db } from '../db/db.module';
import { analisisReuniones, categorias, reuniones } from '../db/schema';
import { filaAnalisis, type MapaCategorias } from './fila-analisis';

export interface OpcionesIngesta {
  limit?: number;
  batch: number;
  concurrencia: number;
  estados?: EstadoAnalisis[];
  // Rango de ids a procesar (una carga desde la UI); sin rango, toda la tabla.
  desdeId?: number;
  hastaId?: number;
}

export interface ResumenIngesta {
  total: number;
  ok: number;
  error: number;
  minutos: number;
}

@Injectable()
export class IngestaService {
  private readonly logger = new Logger(IngestaService.name);
  private detenida = false;

  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly analizador: AnalizadorService,
  ) {}

  // Los lotes en curso terminan y se guardan; los que no empezaron quedan pendientes.
  detener() {
    this.detenida = true;
  }

  // Reanudable: solo toma reuniones 'pendiente' o 'error', así que relanzarla continúa donde quedó.
  async ejecutar({
    limit,
    batch,
    concurrencia,
    estados = ['pendiente', 'error'],
    desdeId,
    hastaId,
  }: OpcionesIngesta): Promise<ResumenIngesta> {
    this.detenida = false;
    const mapa = await this.cargarCategorias();
    const pendientes = await this.db
      .select({ id: reuniones.id })
      .from(reuniones)
      .where(
        and(
          inArray(reuniones.estadoAnalisis, estados),
          desdeId !== undefined ? gte(reuniones.id, desdeId) : undefined,
          hastaId !== undefined ? lte(reuniones.id, hastaId) : undefined,
        ),
      )
      .orderBy(asc(reuniones.id))
      .limit(limit ?? Number.MAX_SAFE_INTEGER);

    const cola = dividirEnLotes(
      pendientes.map(({ id }) => id),
      batch,
    );
    const resumen: ResumenIngesta = {
      total: pendientes.length,
      ok: 0,
      error: 0,
      minutos: 0,
    };
    const inicio = Date.now();
    this.logger.log(
      `${resumen.total} reuniones por analizar · lotes de ${batch} · ${concurrencia} en paralelo · modelo ${this.analizador.modelo}`,
    );

    const trabajador = async () => {
      for (let ids = cola.shift(); ids && !this.detenida; ids = cola.shift()) {
        const resultado = await this.procesarLote(ids, mapa);
        resumen.ok += resultado.resultados.size;
        resumen.error += resultado.fallidos.length;
        resumen.minutos = (Date.now() - inicio) / 60_000;
        this.logger.log(this.progreso(resumen));
      }
    };
    await Promise.all(Array.from({ length: concurrencia }, trabajador));

    return resumen;
  }

  private async cargarCategorias(): Promise<MapaCategorias> {
    const filas = await this.db.select().from(categorias);
    return new Map(filas.map((c) => [`${c.dimension}:${c.nombre}`, c.id]));
  }

  private async procesarLote(
    ids: number[],
    mapa: MapaCategorias,
  ): Promise<ResultadoLote> {
    const items = await this.db
      .select({ id: reuniones.id, transcripcion: reuniones.transcripcion })
      .from(reuniones)
      .where(inArray(reuniones.id, ids));
    const resultado = await this.analizador.analizarLote(items);
    await this.guardar(resultado, mapa);
    return resultado;
  }

  private async guardar(
    { resultados, fallidos }: ResultadoLote,
    mapa: MapaCategorias,
  ) {
    const filas = [...resultados].map(([reunionId, resultado]) =>
      filaAnalisis(reunionId, resultado, mapa, this.analizador.modelo),
    );

    await this.db.transaction(async (tx) => {
      if (filas.length > 0) {
        await tx
          .insert(analisisReuniones)
          .values(filas)
          .onConflictDoUpdate({
            target: analisisReuniones.reunionId,
            set: {
              industriaId: sql`excluded.industria_id`,
              canalAdquisicionId: sql`excluded.canal_adquisicion_id`,
              dolorPrincipalId: sql`excluded.dolor_principal_id`,
              tamanoEmpresa: sql`excluded.tamano_empresa`,
              volumenMensual: sql`excluded.volumen_mensual`,
              casosUso: sql`excluded.casos_uso`,
              integraciones: sql`excluded.integraciones`,
              canalesAtencion: sql`excluded.canales_atencion`,
              respuestaCruda: sql`excluded.respuesta_cruda`,
              creadoEn: sql`now()`,
            },
          });
        await tx
          .update(reuniones)
          .set({ estadoAnalisis: 'ok' })
          .where(inArray(reuniones.id, [...resultados.keys()]));
      }
      if (fallidos.length > 0) {
        await tx
          .update(reuniones)
          .set({ estadoAnalisis: 'error' })
          .where(inArray(reuniones.id, fallidos));
      }
    });
  }

  private progreso({ total, ok, error, minutos }: ResumenIngesta) {
    const hechas = ok + error;
    const porMinuto = minutos > 0 ? hechas / minutos : 0;
    const eta = porMinuto > 0 ? Math.round((total - hechas) / porMinuto) : '?';
    return `${hechas}/${total} · ok ${ok} · error ${error} · ${porMinuto.toFixed(1)} filas/min · ETA ${eta} min`;
  }
}
