// test
import { segmentar } from './segmentar';

describe('segmentar', () => {
  it('calcula tasa, tasa base ponderada y delta contra la base', () => {
    const { tasaBase, segmentos } = segmentar([
      { clave: 'retail', n: 40, cerradas: 30 },
      { clave: 'agro', n: 60, cerradas: 30 },
    ]);

    expect(tasaBase).toBeCloseTo(0.6);
    expect(segmentos[0]).toEqual({
      clave: 'retail',
      n: 40,
      cerradas: 30,
      tasa: 0.75,
      delta: expect.closeTo(0.15) as number,
      muestraChica: false,
    });
    expect(segmentos[1].delta).toBeCloseTo(-0.1);
  });

  it('marca como muestra chica los segmentos con menos de 30 reuniones', () => {
    const { segmentos } = segmentar([
      { clave: 'a', n: 29, cerradas: 10 },
      { clave: 'b', n: 30, cerradas: 10 },
    ]);
    expect(segmentos.map((s) => s.muestraChica)).toEqual([true, false]);
  });

  it('sin datos no hay tasa base', () => {
    expect(segmentar([])).toEqual({ tasaBase: null, segmentos: [] });
  });
});
