// test
import { FiltrosSchema } from '@vambe/shared';
import { PgDialect } from 'drizzle-orm/pg-core';
import { construirWhere } from './filtros-sql';

const dialecto = new PgDialect();
const renderizar = (query: Record<string, string>) => {
  const where = construirWhere(FiltrosSchema.parse(query));
  return where ? dialecto.sqlToQuery(where) : undefined;
};

describe('construirWhere', () => {
  it('sin filtros no agrega condiciones', () => {
    expect(renderizar({})).toBeUndefined();
  });

  it('filtra categorías por nombre con una subconsulta a categorias', () => {
    const query = renderizar({ industria: 'salud,retail' });
    expect(query?.sql).toContain('"analisis_reuniones"."industria_id" in');
    expect(query?.params).toEqual(['industria', 'salud', 'retail']);
  });

  it('filtra listas con && (tiene alguno de los valores)', () => {
    const query = renderizar({ casoUso: 'faq,cotizacion' });
    expect(query?.sql).toContain('"analisis_reuniones"."casos_uso" &&');
  });

  it('combina filtros distintos con AND', () => {
    const query = renderizar({ closed: 'false', vendedor: '2' });
    expect(query?.sql).toMatch(/closed.* and .*vendedor_id/);
    expect(query?.params).toEqual([false, 2]);
  });

  it('la búsqueda escapa los comodines de LIKE', () => {
    const query = renderizar({ q: '100%_real' });
    expect(query?.sql).toContain('ilike');
    expect(query?.params).toContain('%100\\%\\_real%');
  });
});
