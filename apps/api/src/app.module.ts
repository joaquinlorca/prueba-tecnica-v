import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validarEnv } from './config/env';
import { AnalisisModule } from './analisis/analisis.module';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { IngestaModule } from './ingesta/ingesta.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEnv }),
    DbModule,
    AnalisisModule,
    IngestaModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
