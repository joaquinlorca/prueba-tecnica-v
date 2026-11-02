// test
// e2e contra la BD real (solo lecturas) con el LLM reemplazado por uno falso.
// Requiere apps/api/.env y la muestra base cargada.
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type {
  CierrePorDimension,
  Paginado,
  ResumenMetricas,
  ReunionResumen,
} from '@vambe/shared';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { LLM_PROVIDER, type LLMProvider } from '../src/llm/llm-provider';

const llmFalso: LLMProvider = {
  modelo: 'falso',
  generar: (prompt) => {
    const ids = [...prompt.matchAll(/<t id="(\d+)">/g)]
      .map((m) => Number(m[1]))
      .filter((id) => id !== 0);
    return Promise.resolve({
      texto: JSON.stringify(
        ids.map((id) => ({
          id,
          industria: 'gastronomia',
          canal_adquisicion: 'recomendacion',
          dolor_principal: 'perdida_ventas_leads',
          tamano_empresa: 'pequena',
          volumen: { min: 80, max: 80, periodo: 'dia' },
          casos_uso: ['cotizacion'],
          integraciones: ['pagos'],
          canales_atencion: ['instagram'],
        })),
      ),
    });
  },
};

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LLM_PROVIDER)
      .useValue(llmFalso)
      .compile();
    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  const get = <T>(url: string) =>
    request(app.getHttpServer())
      .get(url)
      .expect(200)
      .then((res) => res.body as T);

  it('GET /reuniones filtra por industria y el total coincide con las métricas', async () => {
    const listado = await get<Paginado<ReunionResumen>>(
      '/reuniones?industria=salud&pageSize=100',
    );
    const cierre = await get<CierrePorDimension>(
      '/metricas/cierre?dimension=industria',
    );

    expect(listado.items.length).toBeGreaterThan(0);
    expect(listado.items.every((r) => r.analisis?.industria === 'salud')).toBe(
      true,
    );
    expect(listado.total).toBe(
      cierre.segmentos.find((s) => s.clave === 'salud')?.n,
    );
  });

  it('la suma de los segmentos por industria es igual a las reuniones analizadas', async () => {
    const resumen = await get<ResumenMetricas>('/metricas/resumen');
    const cierre = await get<CierrePorDimension>(
      '/metricas/cierre?dimension=industria',
    );

    const suma = cierre.segmentos.reduce((total, s) => total + s.n, 0);
    expect(suma).toBe(resumen.analizadas);
  });

  it('un filtro aplica igual a las métricas: closed=true deja solo cerradas', async () => {
    const todas = await get<ResumenMetricas>('/metricas/resumen');
    const cerradas = await get<ResumenMetricas>(
      '/metricas/resumen?closed=true',
    );

    expect(cerradas.total).toBe(todas.cerradas);
    expect(cerradas.tasaCierre).toBe(1);
  });

  it('responde 400 con el detalle si un filtro es inválido', async () => {
    const res = await request(app.getHttpServer())
      .get('/reuniones?industria=mineria')
      .expect(400);
    expect(
      (res.body as { errores: { campo: string }[] }).errores[0].campo,
    ).toBe('industria.0');
  });

  it('GET /reuniones/:id responde 404 si no existe', () =>
    request(app.getHttpServer()).get('/reuniones/999999').expect(404));

  it('POST /analisis rechaza transcripciones demasiado cortas', () =>
    request(app.getHttpServer())
      .post('/analisis')
      .send({ transcripcion: 'hola' })
      .expect(400));

  it('POST /analisis devuelve el análisis normalizado', async () => {
    const res = await request(app.getHttpServer())
      .post('/analisis')
      .send({
        transcripcion:
          'Tenemos tres pastelerías y recibimos unas 80 consultas al día por Instagram.',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      industria: 'gastronomia',
      volumen_mensual: 2433,
      integraciones: ['pagos'],
    });
  });
});
