// test
import type { z } from 'zod';
import {
  CANAL_ADQUISICION_LABELS,
  CANAL_ATENCION_LABELS,
  CASO_USO_LABELS,
  DOLOR_PRINCIPAL_LABELS,
  type EtiquetaCategoria,
  INDUSTRIA_LABELS,
  INTEGRACION_LABELS,
  TAMANO_EMPRESA_LABELS,
} from './labels';
import {
  CanalAdquisicionSchema,
  CanalAtencionSchema,
  CasoUsoSchema,
  DolorPrincipalSchema,
  IndustriaSchema,
  IntegracionSchema,
  TamanoEmpresaSchema,
} from './taxonomia';

const casos: [string, z.ZodEnum, Record<string, EtiquetaCategoria>][] = [
  ['industria', IndustriaSchema, INDUSTRIA_LABELS],
  ['canal_adquisicion', CanalAdquisicionSchema, CANAL_ADQUISICION_LABELS],
  ['dolor_principal', DolorPrincipalSchema, DOLOR_PRINCIPAL_LABELS],
  ['tamano_empresa', TamanoEmpresaSchema, TAMANO_EMPRESA_LABELS],
  ['casos_uso', CasoUsoSchema, CASO_USO_LABELS],
  ['integraciones', IntegracionSchema, INTEGRACION_LABELS],
  ['canales_atencion', CanalAtencionSchema, CANAL_ATENCION_LABELS],
];

describe.each(casos)('labels de %s', (_nombre, schema, labels) => {
  it('cubren exactamente los valores del enum', () => {
    expect(Object.keys(labels).sort()).toEqual([...schema.options].sort());
  });

  it('tienen label y descripción no vacíos', () => {
    for (const { label, descripcion } of Object.values(labels)) {
      expect(label.trim()).not.toBe('');
      expect(descripcion.trim()).not.toBe('');
    }
  });
});
