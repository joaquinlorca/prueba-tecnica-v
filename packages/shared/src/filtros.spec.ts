// test
import { FiltrosSchema, ListadoSchema } from './filtros';

describe('FiltrosSchema', () => {
  it('sin parámetros no aplica filtros', () => {
    expect(FiltrosSchema.parse({})).toEqual({});
  });

  it('acepta varios valores separados por coma', () => {
    const filtros = FiltrosSchema.parse({ industria: 'salud,retail' });
    expect(filtros.industria).toEqual(['salud', 'retail']);
  });

  it('acepta valores repetidos en la query (?industria=a&industria=b)', () => {
    const filtros = FiltrosSchema.parse({ industria: ['salud', 'retail'] });
    expect(filtros.industria).toEqual(['salud', 'retail']);
  });

  it('convierte los ids de vendedor a número', () => {
    expect(FiltrosSchema.parse({ vendedor: '1,3' }).vendedor).toEqual([1, 3]);
  });

  it('closed=false es false (no true como con coerce.boolean)', () => {
    expect(FiltrosSchema.parse({ closed: 'false' }).closed).toBe(false);
    expect(FiltrosSchema.parse({ closed: 'true' }).closed).toBe(true);
  });

  it('ignora parámetros vacíos', () => {
    expect(FiltrosSchema.parse({ q: '  ', industria: '' })).toEqual({});
  });

  it('rechaza una categoría que no existe', () => {
    expect(FiltrosSchema.safeParse({ industria: 'mineria' }).success).toBe(
      false,
    );
  });

  it('rechaza fechas inválidas', () => {
    expect(FiltrosSchema.safeParse({ desde: '15/02/2024' }).success).toBe(
      false,
    );
  });
});

describe('ListadoSchema', () => {
  it('aplica paginación y orden por defecto', () => {
    expect(ListadoSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      orden: 'fecha_desc',
    });
  });

  it('rechaza pageSize mayor a 100', () => {
    expect(ListadoSchema.safeParse({ pageSize: '500' }).success).toBe(false);
  });
});
