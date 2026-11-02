import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { dividirEnLotes } from '../common/dividir-en-lotes';
import type { Db } from '../db/db.module';
import { clientes, reuniones, vendedores } from '../db/schema';

const FilaCsvSchema = z
  .object({
    Nombre: z.string().trim().min(1),
    'Correo Electronico': z.string().trim().min(1),
    'Numero de Telefono': z.string().trim(),
    'Fecha de la Reunion': z.iso.date(),
    'Vendedor asignado': z.string().trim().min(1),
    closed: z.enum(['0', '1']),
    Transcripcion: z.string().trim().min(1),
  })
  .transform((fila) => ({
    nombre: fila.Nombre,
    email: fila['Correo Electronico'],
    telefono: fila['Numero de Telefono'] || null,
    fecha: fila['Fecha de la Reunion'],
    vendedor: fila['Vendedor asignado'],
    closed: fila.closed === '1',
    transcripcion: fila.Transcripcion,
  }));
export type FilaCsv = z.output<typeof FilaCsvSchema>;

export const parsearCsv = (contenido: string): FilaCsv[] => {
  const registros: unknown[] = parse(contenido, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
  return registros.map((registro, i) => {
    const resultado = FilaCsvSchema.safeParse(registro);
    if (!resultado.success) {
      // +2: la fila 1 es el encabezado.
      throw new Error(
        `Fila ${i + 2} del CSV inválida:\n${z.prettifyError(resultado.error)}`,
      );
    }
    return resultado.data;
  });
};

const TAMANO_BLOQUE = 500;

// Inserta clientes y reuniones (estado 'pendiente') en una transacción y
// devuelve los ids de las reuniones creadas, en orden.
// Cada fila es un cliente nuevo: nombres y emails repetidos son personas distintas.
export const insertarFilas = (db: Db, filas: FilaCsv[]) =>
  db.transaction(async (tx) => {
    const nombres = [...new Set(filas.map((fila) => fila.vendedor))];
    await tx
      .insert(vendedores)
      .values(nombres.map((nombre) => ({ nombre })))
      .onConflictDoNothing();
    const idVendedor = new Map(
      (await tx.select().from(vendedores)).map((v) => [v.nombre, v.id]),
    );

    const idsReuniones: number[] = [];
    for (const bloque of dividirEnLotes(filas, TAMANO_BLOQUE)) {
      const insertados = await tx
        .insert(clientes)
        .values(
          bloque.map(({ nombre, email, telefono }) => ({
            nombre,
            email,
            telefono,
          })),
        )
        .returning({ id: clientes.id });
      // Los serial se asignan en el orden de VALUES: ordenar los ids devuelve la
      // correspondencia con `bloque` aunque RETURNING no garantice el orden.
      const idsClientes = insertados.map(({ id }) => id).sort((a, b) => a - b);

      const nuevas = await tx
        .insert(reuniones)
        .values(
          bloque.map((fila, i) => ({
            clienteId: idsClientes[i],
            vendedorId: idVendedor.get(fila.vendedor)!,
            fecha: fila.fecha,
            closed: fila.closed,
            transcripcion: fila.transcripcion,
          })),
        )
        .returning({ id: reuniones.id });
      idsReuniones.push(...nuevas.map(({ id }) => id));
    }
    return idsReuniones.sort((a, b) => a - b);
  });

// Solo carga si `reuniones` está vacía, así la ingesta se puede relanzar sin duplicar.
export const cargarCsvSiVacio = async (
  db: Db,
  ruta: string,
  maxFilas?: number,
) => {
  const existentes = await db.$count(reuniones);
  if (existentes > 0) return { cargadas: 0, existentes };

  const filas = parsearCsv(await readFile(ruta, 'utf8')).slice(0, maxFilas);
  await insertarFilas(db, filas);
  return { cargadas: filas.length, existentes: 0 };
};
