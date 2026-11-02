// test
import { extraerJson, validarLote } from './parsear-respuesta';

const item = (id: number | string, extra: object = {}) => ({
  id,
  industria: 'salud',
  canal_adquisicion: 'recomendacion',
  dolor_principal: 'equipo_saturado',
  tamano_empresa: 'pequena',
  volumen: { min: 400, max: 400, periodo: 'mes' },
  casos_uso: ['agendamiento'],
  integraciones: [],
  canales_atencion: ['telefono'],
  ...extra,
});

describe('extraerJson', () => {
  it('parsea un array JSON limpio', () => {
    expect(extraerJson('[{"id":1}]')).toEqual([{ id: 1 }]);
  });

  it('quita fences de markdown y texto alrededor', () => {
    const texto =
      '¡Claro! Aquí está:\n```json\n[{"id":1}]\n```\nEspero que sirva.';
    expect(extraerJson(texto)).toEqual([{ id: 1 }]);
  });

  it('lanza error si no hay JSON', () => {
    expect(() => extraerJson('no puedo ayudarte con eso')).toThrow();
  });

  it('lanza error si el JSON está cortado', () => {
    expect(() => extraerJson('[{"id":1},{"id":')).toThrow();
  });
});

describe('validarLote', () => {
  it('valida cada item y lo asocia a su id', () => {
    const { validos, fallidos } = validarLote([item(1), item('2')], [1, 2]);
    expect([...validos.keys()]).toEqual([1, 2]);
    expect(validos.get(1)?.analisis.volumen_mensual).toBe(400);
    expect(fallidos).toEqual([]);
  });

  it('guarda el item crudo para respuesta_cruda', () => {
    const crudo = item(1);
    const { validos } = validarLote([crudo], [1]);
    expect(validos.get(1)?.crudo).toBe(crudo);
  });

  it('marca como fallidos los ids que faltan', () => {
    const { fallidos } = validarLote([item(1)], [1, 2, 3]);
    expect(fallidos).toEqual([2, 3]);
  });

  it('marca como fallido un item con categoría inválida', () => {
    const { validos, fallidos } = validarLote(
      [item(1), item(2, { industria: 'mineria' })],
      [1, 2],
    );
    expect([...validos.keys()]).toEqual([1]);
    expect(fallidos).toEqual([2]);
  });

  it('ignora ids que no se pidieron', () => {
    const { validos } = validarLote([item(1), item(99)], [1]);
    expect([...validos.keys()]).toEqual([1]);
  });

  it('con ids duplicados se queda con el primero válido', () => {
    const { validos } = validarLote(
      [
        item(1, { industria: 'mineria' }),
        item(1, { industria: 'retail' }),
        item(1, { industria: 'agro' }),
      ],
      [1],
    );
    expect(validos.get(1)?.analisis.industria).toBe('retail');
  });

  it('con rescatarDolor, un dolor fuera de la taxonomía se guarda como "otro"', () => {
    const crudo = item(1, { dolor_principal: 'agendamiento' });
    const { validos, fallidos } = validarLote([crudo], [1], {
      rescatarDolor: true,
    });
    expect(fallidos).toEqual([]);
    expect(validos.get(1)?.analisis.dolor_principal).toBe('otro');
    // La respuesta original queda intacta para respuesta_cruda.
    expect(validos.get(1)?.crudo).toBe(crudo);
  });

  it('sin rescatarDolor, ese mismo dolor inválido falla', () => {
    const { fallidos } = validarLote(
      [item(1, { dolor_principal: 'agendamiento' })],
      [1],
    );
    expect(fallidos).toEqual([1]);
  });

  it('el rescate solo aplica al dolor: otro campo inválido sigue fallando', () => {
    const { fallidos } = validarLote(
      [item(1, { industria: 'mineria', dolor_principal: 'agendamiento' })],
      [1],
      { rescatarDolor: true },
    );
    expect(fallidos).toEqual([1]);
  });

  it('si la respuesta no es un array, todos fallan', () => {
    const { validos, fallidos } = validarLote({ id: 1 }, [1, 2]);
    expect(validos.size).toBe(0);
    expect(fallidos).toEqual([1, 2]);
  });
});
