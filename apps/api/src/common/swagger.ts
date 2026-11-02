import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import {
  CanalAdquisicionSchema,
  CanalAtencionSchema,
  CasoUsoSchema,
  DolorPrincipalSchema,
  IndustriaSchema,
  IntegracionSchema,
  OrdenListadoSchema,
  TamanoEmpresaSchema,
} from '@vambe/shared';

const lista = (name: string, valores: readonly string[]) =>
  ApiQuery({
    name,
    required: false,
    description: `Uno o más valores separados por coma: ${valores.join(', ')}`,
  });

// Documenta en Swagger los filtros de FiltrosSchema (shared), que comparten
// el listado y todas las métricas.
export const ApiFiltros = () =>
  applyDecorators(
    ApiQuery({
      name: 'q',
      required: false,
      description: 'Busca en nombre, email y transcripción',
    }),
    ApiQuery({
      name: 'vendedor',
      required: false,
      description: 'Ids de vendedor separados por coma',
    }),
    ApiQuery({ name: 'desde', required: false, example: '2024-01-01' }),
    ApiQuery({ name: 'hasta', required: false, example: '2024-12-31' }),
    ApiQuery({ name: 'closed', required: false, enum: ['true', 'false'] }),
    lista('industria', IndustriaSchema.options),
    lista('canal', CanalAdquisicionSchema.options),
    lista('dolor', DolorPrincipalSchema.options),
    lista('tamano', TamanoEmpresaSchema.options),
    lista('casoUso', CasoUsoSchema.options),
    lista('integracion', IntegracionSchema.options),
    lista('canalAtencion', CanalAtencionSchema.options),
  );

export const ApiListado = () =>
  applyDecorators(
    ApiFiltros(),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'pageSize', required: false, example: 20 }),
    ApiQuery({
      name: 'orden',
      required: false,
      enum: OrdenListadoSchema.options,
    }),
  );
