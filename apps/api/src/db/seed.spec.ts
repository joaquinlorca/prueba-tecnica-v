// test
import { DimensionCategoriaSchema } from '@vambe/shared';
import { filasCategorias } from './seed';

describe('filasCategorias', () => {
  const filas = filasCategorias();

  it('genera una fila por cada valor de la taxonomía (14 + 9 + 6)', () => {
    expect(filas).toHaveLength(29);
  });

  it('no repite pares (dimension, nombre)', () => {
    const pares = new Set(
      filas.map(({ dimension, nombre }) => `${dimension}:${nombre}`),
    );
    expect(pares.size).toBe(filas.length);
  });

  it('solo usa dimensiones válidas', () => {
    for (const { dimension } of filas) {
      expect(DimensionCategoriaSchema.options).toContain(dimension);
    }
  });
});
