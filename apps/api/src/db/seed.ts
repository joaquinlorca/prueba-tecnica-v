import {
  CATEGORIAS_POR_DIMENSION,
  type DimensionCategoria,
} from '@vambe/shared';
import type { Db } from './db.module';
import { categorias } from './schema';

// Solo la taxonomía: los vendedores son datos y se crean al cargar el CSV.
export const filasCategorias = (): {
  dimension: DimensionCategoria;
  nombre: string;
}[] =>
  Object.entries(CATEGORIAS_POR_DIMENSION).flatMap(([dimension, nombres]) =>
    nombres.map((nombre) => ({
      dimension: dimension as DimensionCategoria,
      nombre,
    })),
  );

export const seedCatalogos = async (db: Db) => {
  const insertadas = await db
    .insert(categorias)
    .values(filasCategorias())
    .onConflictDoNothing()
    .returning({ id: categorias.id });
  const total = await db.$count(categorias);
  return { categoriasInsertadas: insertadas.length, categoriasTotal: total };
};
