// test
import type { Analisis } from '@vambe/shared';
import { PROMPT_VERSION } from '../analisis/prompt';
import { filaAnalisis } from './fila-analisis';

const analisis: Analisis = {
  industria: 'salud',
  canal_adquisicion: 'linkedin',
  dolor_principal: 'otro',
  tamano_empresa: 'pequena',
  volumen_mensual: 1300,
  casos_uso: ['agendamiento'],
  integraciones: ['crm'],
  canales_atencion: ['whatsapp'],
};

const categorias = new Map([
  ['industria:salud', 1],
  ['canal_adquisicion:linkedin', 20],
  ['dolor_principal:otro', 30],
]);

describe('filaAnalisis', () => {
  it('traduce las categorías a sus ids y guarda la respuesta cruda versionada', () => {
    const fila = filaAnalisis(
      7,
      { analisis, crudo: { id: '7' } },
      categorias,
      'gemma-test',
    );

    expect(fila).toEqual({
      reunionId: 7,
      industriaId: 1,
      canalAdquisicionId: 20,
      dolorPrincipalId: 30,
      tamanoEmpresa: 'pequena',
      volumenMensual: 1300,
      casosUso: ['agendamiento'],
      integraciones: ['crm'],
      canalesAtencion: ['whatsapp'],
      respuestaCruda: {
        prompt_version: PROMPT_VERSION,
        modelo: 'gemma-test',
        item: { id: '7' },
      },
    });
  });

  it('falla si una categoría no está en la BD (falta correr el seed)', () => {
    expect(() =>
      filaAnalisis(7, { analisis, crudo: {} }, new Map(), 'gemma-test'),
    ).toThrow(/industria:salud/);
  });
});
