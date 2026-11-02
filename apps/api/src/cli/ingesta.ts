import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import type { Env } from '../config/env';
import { DRIZZLE, type Db } from '../db/db.module';
import { seedCatalogos } from '../db/seed';
import { cargarCsvSiVacio } from '../ingesta/cargar-csv';
import { IngestaService } from '../ingesta/ingesta.service';

// Uso: pnpm --filter api ingesta -- [--filas 1500] [--limit 20] [--batch 15] [--concurrencia 4] [--csv ruta]
// --filas: cuántas filas del CSV cargar (solo si la BD está vacía). --limit: cuántas analizar.
const CSV_POR_DEFECTO = resolve(
  __dirname,
  '../../../../data/vambe_clients_10k.csv',
);

const entero = (valor: string | undefined) =>
  valor === undefined ? undefined : Number.parseInt(valor, 10);

async function main() {
  const { values } = parseArgs({
    options: {
      limit: { type: 'string' },
      batch: { type: 'string' },
      concurrencia: { type: 'string' },
      filas: { type: 'string' },
      csv: { type: 'string', default: CSV_POR_DEFECTO },
    },
  });

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const ingesta = app.get(IngestaService);
  process.once('SIGINT', () => {
    console.log('\nDeteniendo: se terminan los lotes en curso…');
    ingesta.detener();
  });

  try {
    const db = app.get<Db>(DRIZZLE);
    const config = app.get<ConfigService<Env, true>>(ConfigService);

    console.log('Seed:', await seedCatalogos(db));
    console.log(
      'CSV:',
      await cargarCsvSiVacio(db, values.csv, entero(values.filas)),
    );

    const resumen = await ingesta.ejecutar({
      limit: entero(values.limit),
      batch: entero(values.batch) ?? config.get('INGESTA_BATCH_SIZE'),
      concurrencia:
        entero(values.concurrencia) ?? config.get('INGESTA_CONCURRENCIA'),
    });
    console.log('Ingesta terminada:', resumen);
  } finally {
    await app.close();
  }
}
void main();
