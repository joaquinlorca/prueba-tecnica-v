import { z } from 'zod';

export const IndustriaSchema = z.enum([
  'salud',
  'educacion',
  'retail',
  'ecommerce',
  'gastronomia',
  'turismo',
  'servicios_profesionales',
  'servicios_tecnicos',
  'logistica',
  'inmobiliaria',
  'tecnologia_telecom',
  'agro',
  'financiero',
  'otro',
]);
export type Industria = z.infer<typeof IndustriaSchema>;

export const CanalAdquisicionSchema = z.enum([
  'recomendacion',
  'linkedin',
  'google_busqueda',
  'evento_conferencia',
  'podcast',
  'redes_sociales',
  'mailing',
  'prensa_publicacion',
  'otro',
]);
export type CanalAdquisicion = z.infer<typeof CanalAdquisicionSchema>;

export const DolorPrincipalSchema = z.enum([
  'equipo_saturado',
  'crecimiento_sin_contratar',
  'consultas_repetitivas',
  'atencion_fuera_horario',
  'perdida_ventas_leads',
  'otro',
]);
export type DolorPrincipal = z.infer<typeof DolorPrincipalSchema>;

export const TamanoEmpresaSchema = z.enum(['micro', 'pequena', 'mediana', 'grande']);
export type TamanoEmpresa = z.infer<typeof TamanoEmpresaSchema>;

export const CasoUsoSchema = z.enum([
  'agendamiento',
  'faq',
  'cotizacion',
  'seguimiento_pedidos',
  'catalogo_recomendacion',
  'calificacion_leads',
  'derivacion_humano',
  'soporte_postventa',
]);
export type CasoUso = z.infer<typeof CasoUsoSchema>;

export const IntegracionSchema = z.enum([
  'crm',
  'ecommerce',
  'erp_inventario',
  'sistema_reservas',
  'api_propia',
  'pagos',
]);
export type Integracion = z.infer<typeof IntegracionSchema>;

export const CanalAtencionSchema = z.enum(['whatsapp', 'instagram', 'web', 'email', 'telefono']);
export type CanalAtencion = z.infer<typeof CanalAtencionSchema>;

// Sin 'hora': en los datos solo aparece para peaks (Black Friday, hora punta), no para el volumen habitual.
export const PeriodoVolumenSchema = z.enum(['dia', 'semana', 'mes', 'anio']);
export type PeriodoVolumen = z.infer<typeof PeriodoVolumenSchema>;

// Dimensiones que viven en la tabla `categorias` (FK desde analisis_reuniones).
export const DimensionCategoriaSchema = z.enum(['industria', 'canal_adquisicion', 'dolor_principal']);
export type DimensionCategoria = z.infer<typeof DimensionCategoriaSchema>;

export const CATEGORIAS_POR_DIMENSION = {
  industria: IndustriaSchema.options,
  canal_adquisicion: CanalAdquisicionSchema.options,
  dolor_principal: DolorPrincipalSchema.options,
} satisfies Record<DimensionCategoria, readonly string[]>;
