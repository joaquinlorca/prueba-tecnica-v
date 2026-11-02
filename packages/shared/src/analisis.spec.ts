// test
import {
  AnalisisLLMItemSchema,
  normalizarAnalisis,
  normalizarVolumen,
} from './analisis';

const itemValido = {
  id: 1,
  industria: 'retail',
  canal_adquisicion: 'linkedin',
  dolor_principal: 'equipo_saturado',
  tamano_empresa: 'mediana',
  volumen: { min: 800, max: 1500, periodo: 'dia' },
  casos_uso: ['faq', 'derivacion_humano'],
  integraciones: [],
  canales_atencion: ['whatsapp'],
};

describe('normalizarVolumen', () => {
  it.each([
    [{ min: 400, max: 400, periodo: 'mes' }, 400],
    [{ min: 800, max: 1500, periodo: 'dia' }, 34979],
    [{ min: 300, max: 300, periodo: 'semana' }, 1300],
    [{ min: 1200, max: 1200, periodo: 'anio' }, 100],
  ] as const)('%o → %i consultas/mes', (volumen, esperado) => {
    expect(normalizarVolumen(volumen)).toBe(esperado);
  });

  it('devuelve null si no hay volumen', () => {
    expect(normalizarVolumen(null)).toBeNull();
  });
});

describe('AnalisisLLMItemSchema', () => {
  it('acepta un item válido con arrays vacíos', () => {
    const resultado = AnalisisLLMItemSchema.safeParse(itemValido);
    expect(resultado.success).toBe(true);
  });

  it('normaliza mayúsculas, tildes y espacios antes de validar el enum', () => {
    const item = AnalisisLLMItemSchema.parse({
      ...itemValido,
      industria: ' Educación ',
      canal_adquisicion: 'Google Búsqueda',
      tamano_empresa: 'Pequeña',
      volumen: { min: 10, max: 10, periodo: 'Día' },
    });
    expect(item.industria).toBe('educacion');
    expect(item.canal_adquisicion).toBe('google_busqueda');
    expect(item.tamano_empresa).toBe('pequena');
    expect(item.volumen?.periodo).toBe('dia');
  });

  it('falla si una dimensión de valor único trae un valor fuera de la taxonomía', () => {
    const resultado = AnalisisLLMItemSchema.safeParse({
      ...itemValido,
      industria: 'mineria',
    });
    expect(resultado.success).toBe(false);
  });

  it('descarta valores desconocidos y duplicados en las listas', () => {
    const item = AnalisisLLMItemSchema.parse({
      ...itemValido,
      integraciones: ['crm', 'sap_magico', 'CRM'],
    });
    expect(item.integraciones).toEqual(['crm']);
  });

  it('falla si el volumen tiene max < min', () => {
    const resultado = AnalisisLLMItemSchema.safeParse({
      ...itemValido,
      volumen: { min: 500, max: 100, periodo: 'mes' },
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza volúmenes por hora (suelen ser peaks, no el volumen habitual)', () => {
    const resultado = AnalisisLLMItemSchema.safeParse({
      ...itemValido,
      volumen: { min: 300, max: 300, periodo: 'hora' },
    });
    expect(resultado.success).toBe(false);
  });

  it('acepta el id como string numérico (Gemma lo devuelve así)', () => {
    const item = AnalisisLLMItemSchema.parse({ ...itemValido, id: '42' });
    expect(item.id).toBe(42);
  });

  it('rechaza un id no numérico', () => {
    const resultado = AnalisisLLMItemSchema.safeParse({
      ...itemValido,
      id: 'abc',
    });
    expect(resultado.success).toBe(false);
  });

  it('acepta tamaño y volumen nulos', () => {
    const resultado = AnalisisLLMItemSchema.safeParse({
      ...itemValido,
      tamano_empresa: null,
      volumen: null,
    });
    expect(resultado.success).toBe(true);
  });
});

describe('normalizarAnalisis', () => {
  it('quita el id y convierte el volumen a mensual', () => {
    const analisis = normalizarAnalisis(AnalisisLLMItemSchema.parse(itemValido));
    expect(analisis).toEqual({
      industria: 'retail',
      canal_adquisicion: 'linkedin',
      dolor_principal: 'equipo_saturado',
      tamano_empresa: 'mediana',
      volumen_mensual: 34979,
      casos_uso: ['faq', 'derivacion_humano'],
      integraciones: [],
      canales_atencion: ['whatsapp'],
    });
  });
});
