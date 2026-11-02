import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CargasService } from './cargas/cargas.service';
import type { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Detrás del proxy de Railway: el throttling necesita la IP real del cliente.
  app.set('trust proxy', 1);
  app.enableCors({ origin: config.get('CORS_ORIGIN') });
  app.enableShutdownHooks();

  const documento = new DocumentBuilder()
    .setTitle('Vambe Sales Insights API')
    .setDescription(
      'Reuniones de venta categorizadas con un LLM y métricas para el equipo comercial.',
    )
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, documento),
  );

  await app.listen(config.get('PORT'));

  // Si el servidor se reinició a mitad de una carga, retoma lo pendiente.
  void app.get(CargasService).reanudarPendientes();
}
void bootstrap();
