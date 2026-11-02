import { z } from 'zod';
import {
  CanalAdquisicionSchema,
  CanalAtencionSchema,
  CasoUsoSchema,
  DolorPrincipalSchema,
  IndustriaSchema,
  IntegracionSchema,
  type PeriodoVolumen,
  PeriodoVolumenSchema,
  TamanoEmpresaSchema,
} from './taxonomia';

// "Google Búsqueda" → "google_busqueda"
const normalizarToken = (valor: unknown): unknown =>
  typeof valor === 'string'
    ? valor
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '_')
    : valor;

const enumTolerante = <T extends z.ZodEnum>(schema: T) => z.preprocess(normalizarToken, schema);

// En listas, un valor fuera de la taxonomía se descarta en vez de invalidar todo el análisis.
const listaTolerante = <T extends z.ZodEnum>(schema: T) =>
  z.array(z.unknown()).transform((valores) => {
    const validos = valores
      .map(normalizarToken)
      .filter((valor): valor is z.output<T> => schema.safeParse(valor).success);
    return [...new Set(validos)];
  });

const VolumenLLMSchema = z
  .object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    periodo: enumTolerante(PeriodoVolumenSchema),
  })
  .refine((volumen) => volumen.max >= volumen.min, { message: 'max debe ser >= min' });
export type VolumenLLM = z.output<typeof VolumenLLMSchema>;

// Lo que devuelve el LLM por cada transcripción.
export const AnalisisLLMItemSchema = z.object({
  id: z.number().int(),
  industria: enumTolerante(IndustriaSchema),
  canal_adquisicion: enumTolerante(CanalAdquisicionSchema),
  dolor_principal: enumTolerante(DolorPrincipalSchema),
  tamano_empresa: enumTolerante(TamanoEmpresaSchema).nullable(),
  volumen: VolumenLLMSchema.nullable(),
  casos_uso: listaTolerante(CasoUsoSchema),
  integraciones: listaTolerante(IntegracionSchema),
  canales_atencion: listaTolerante(CanalAtencionSchema),
});
export type AnalisisLLMItem = z.output<typeof AnalisisLLMItemSchema>;

// Análisis normalizado: misma forma que las columnas de analisis_reuniones.
export const AnalisisSchema = z.object({
  industria: IndustriaSchema,
  canal_adquisicion: CanalAdquisicionSchema,
  dolor_principal: DolorPrincipalSchema,
  tamano_empresa: TamanoEmpresaSchema.nullable(),
  volumen_mensual: z.number().int().nonnegative().nullable(),
  casos_uso: z.array(CasoUsoSchema),
  integraciones: z.array(IntegracionSchema),
  canales_atencion: z.array(CanalAtencionSchema),
});
export type Analisis = z.infer<typeof AnalisisSchema>;

// Todos los factores salen del año calendario, sin supuestos de horario de atención.
export const FACTOR_MENSUAL = {
  dia: 365 / 12,
  semana: 52 / 12,
  mes: 1,
  anio: 1 / 12,
} satisfies Record<PeriodoVolumen, number>;

export const normalizarVolumen = (volumen: VolumenLLM | null): number | null =>
  volumen === null
    ? null
    : Math.round(((volumen.min + volumen.max) / 2) * FACTOR_MENSUAL[volumen.periodo]);

export const normalizarAnalisis = ({ id: _id, volumen, ...resto }: AnalisisLLMItem): Analisis => ({
  ...resto,
  volumen_mensual: normalizarVolumen(volumen),
});
