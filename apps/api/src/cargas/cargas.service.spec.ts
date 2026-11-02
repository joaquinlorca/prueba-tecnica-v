// test
import { BadRequestException, ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import type { Db } from '../db/db.module';
import type { IngestaService } from '../ingesta/ingesta.service';
import { CargasService } from './cargas.service';

const ENCABEZADO =
  'Nombre,Correo Electronico,Numero de Telefono,Fecha de la Reunion,Vendedor asignado,closed,Transcripcion';
const fila = (i: number) =>
  `Cliente ${i},c${i}@example.com,569000000,2024-05-01,Toro,1,Transcripción ${i}`;
const csv = (filas: number) =>
  [ENCABEZADO, ...Array.from({ length: filas }, (_, i) => fila(i))].join('\n');

const crear = () => {
  // La ingesta "nunca termina": simula una carga en proceso.
  const ejecutar = jest.fn(() => new Promise(() => {}));
  const servicio = new CargasService(
    {} as Db,
    { ejecutar } as unknown as IngestaService,
    { get: () => 15 } as unknown as ConfigService<Env, true>,
  );
  const insertar = jest
    .spyOn(
      servicio as unknown as { insertar: () => Promise<number[]> },
      'insertar',
    )
    .mockResolvedValue([1501, 1502, 1503]);
  return { servicio, ejecutar, insertar };
};

describe('CargasService.crear', () => {
  it('inserta las filas y lanza el análisis en segundo plano sobre ese rango', async () => {
    const { servicio, ejecutar, insertar } = crear();

    await expect(servicio.crear(csv(3))).resolves.toEqual({ total: 3 });

    expect(insertar).toHaveBeenCalledTimes(1);
    expect(ejecutar).toHaveBeenCalledWith(
      expect.objectContaining({ desdeId: 1501, hastaId: 1503 }),
    );
  });

  it('rechaza un CSV con filas inválidas sin insertar nada', async () => {
    const { servicio, insertar } = crear();
    const invalido = `${ENCABEZADO}\n${fila(1)}\nAna,a@x.com,1,2024-05-01,Toro,2,Hola`;

    await expect(servicio.crear(invalido)).rejects.toThrow(/Fila 3/);
    expect(insertar).not.toHaveBeenCalled();
  });

  it('rechaza más de 500 filas', async () => {
    const { servicio, insertar } = crear();

    await expect(servicio.crear(csv(501))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(insertar).not.toHaveBeenCalled();
  });

  it('rechaza un CSV sin filas', async () => {
    const { servicio } = crear();
    await expect(servicio.crear(ENCABEZADO)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('procesa de a una carga: la segunda mientras la primera sigue da 409', async () => {
    const { servicio } = crear();

    await servicio.crear(csv(3));

    await expect(servicio.crear(csv(3))).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
