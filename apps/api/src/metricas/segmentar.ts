import { MUESTRA_MINIMA, type Segmentacion } from '@vambe/shared';

export interface Agregado {
  clave: string;
  n: number;
  cerradas: number;
}

// Los conteos vienen agregados desde SQL; aquí solo se derivan las proporciones.
export const segmentar = (filas: Agregado[]): Segmentacion => {
  const n = filas.reduce((total, fila) => total + fila.n, 0);
  const cerradas = filas.reduce((total, fila) => total + fila.cerradas, 0);
  const tasaBase = n > 0 ? cerradas / n : null;

  return {
    tasaBase,
    segmentos: filas.map((fila) => {
      const tasa = fila.cerradas / fila.n;
      return {
        ...fila,
        tasa,
        delta: tasaBase === null ? 0 : tasa - tasaBase,
        muestraChica: fila.n < MUESTRA_MINIMA,
      };
    }),
  };
};
