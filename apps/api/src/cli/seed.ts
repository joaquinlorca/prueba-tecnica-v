import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DRIZZLE, type Db } from '../db/db.module';
import { seedCatalogos } from '../db/seed';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const resultado = await seedCatalogos(app.get<Db>(DRIZZLE));
    console.log('Seed completado:', resultado);
  } finally {
    await app.close();
  }
}
void main();
