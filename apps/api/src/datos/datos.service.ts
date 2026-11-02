import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import type { DatosEliminados } from '@vambe/shared';
import { sql } from 'drizzle-orm';
import { CargasService } from '../cargas/cargas.service';
import { DRIZZLE, type Db } from '../db/db.module';
import {
  analisisReuniones,
  clientes,
  reuniones,
  vendedores,
} from '../db/schema';

// Deja la base como recién creada para probar desde cero con un CSV.
// Solo borra filas: la estructura y la taxonomía (categorias) no se tocan.
@Injectable()
export class DatosService {
  private readonly logger = new Logger(DatosService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly cargas: CargasService,
  ) {}

  async vaciar(): Promise<DatosEliminados> {
    if (this.cargas.enProceso) {
      throw new ConflictException(
        'Hay una carga de CSV en proceso: espera a que termine para borrar los datos.',
      );
    }

    const resultado = await this.db.transaction(async (tx) => {
      const eliminadas = {
        reuniones: await tx.$count(reuniones),
        clientes: await tx.$count(clientes),
        analisis: await tx.$count(analisisReuniones),
        vendedores: await tx.$count(vendedores),
      };
      // Lista fija y sin CASCADE: si otra tabla dependiera de estas, el
      // TRUNCATE falla en vez de vaciarla en silencio.
      await tx.execute(
        sql`truncate table ${analisisReuniones}, ${reuniones}, ${clientes}, ${vendedores} restart identity`,
      );
      return { eliminadas };
    });

    this.cargas.olvidarUltimaCarga();
    this.logger.warn(
      `Datos eliminados: ${JSON.stringify(resultado.eliminadas)}`,
    );
    return resultado;
  }
}
