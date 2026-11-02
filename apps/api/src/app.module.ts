import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AnalisisModule } from './analisis/analisis.module';
import { CargasModule } from './cargas/cargas.module';
import { validarEnv } from './config/env';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { IngestaModule } from './ingesta/ingesta.module';
import { MetricasModule } from './metricas/metricas.module';
import { ReunionesModule } from './reuniones/reuniones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEnv }),
    // Límites por defecto; cada endpoint que usa el LLM define el suyo con @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DbModule,
    AnalisisModule,
    IngestaModule,
    CargasModule,
    ReunionesModule,
    MetricasModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
