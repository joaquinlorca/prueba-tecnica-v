// test
import { ConflictException } from '@nestjs/common';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { CargasService } from '../cargas/cargas.service';
import type { Db } from '../db/db.module';
import { DatosService } from './datos.service';

const crear = (enProceso = false) => {
  const ejecutadas: SQL[] = [];
  const tx = {
    $count: jest.fn(() => Promise.resolve(7)),
    execute: jest.fn((consulta: SQL) => {
      ejecutadas.push(consulta);
      return Promise.resolve([]);
    }),
  };
  const db = {
    transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  const cargas = { enProceso, olvidarUltimaCarga: jest.fn() };
  const servicio = new DatosService(
    db as unknown as Db,
    cargas as unknown as CargasService,
  );
  const sqlEjecutado = () =>
    ejecutadas.map((c) => new PgDialect().sqlToQuery(c).sql).join('\n');
  return { servicio, db, cargas, sqlEjecutado };
};

describe('DatosService.vaciar', () => {
  it('vacía solo las 4 tablas de datos y reinicia los ids', async () => {
    const { servicio, sqlEjecutado } = crear();

    await servicio.vaciar();

    const sql = sqlEjecutado();
    expect(sql).toMatch(
      /^truncate table "analisis_reuniones", "reuniones", "clientes", "vendedores" restart identity$/i,
    );
  });

  it('nunca toca la taxonomía ni la estructura de la BD', async () => {
    const { servicio, sqlEjecutado } = crear();

    await servicio.vaciar();

    const sql = sqlEjecutado().toLowerCase();
    expect(sql).not.toContain('categorias');
    expect(sql).not.toMatch(/\b(cascade|drop|alter|delete)\b/);
  });

  it('devuelve cuántas filas había en cada tabla', async () => {
    const { servicio } = crear();

    await expect(servicio.vaciar()).resolves.toEqual({
      eliminadas: { reuniones: 7, clientes: 7, analisis: 7, vendedores: 7 },
    });
  });

  it('olvida el progreso de la última carga', async () => {
    const { servicio, cargas } = crear();

    await servicio.vaciar();

    expect(cargas.olvidarUltimaCarga).toHaveBeenCalled();
  });

  it('no borra nada si hay una carga de CSV en proceso', async () => {
    const { servicio, db } = crear(true);

    await expect(servicio.vaciar()).rejects.toBeInstanceOf(ConflictException);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
