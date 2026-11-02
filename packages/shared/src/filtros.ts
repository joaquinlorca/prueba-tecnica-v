import { z } from 'zod';
import {
  CanalAdquisicionSchema,
  CanalAtencionSchema,
  CasoUsoSchema,
  DolorPrincipalSchema,
  IndustriaSchema,
  IntegracionSchema,
  TamanoEmpresaSchema,
} from './taxonomia';

// Los filtros llegan como query string: "" se trata como "sin filtro".
const sinVacios = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

// "a,b" o ?x=a&x=b → ["a", "b"]
const separarLista = (valor: unknown) => {
  const valores = Array.isArray(valor) ? valor : [valor];
  const partes = valores
    .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
    .map((v) => (typeof v === 'string' ? v.trim() : v))
    .filter((v) => v !== '' && v !== undefined);
  return partes.length > 0 ? partes : undefined;
};

const lista = <T extends z.ZodType>(schema: T) =>
  z.preprocess(separarLista, z.array(schema).optional());

const opcional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(sinVacios, schema.optional());

export const FiltrosSchema = z.object({
  q: opcional(z.string().trim().max(100)),
  // Solo nombre y email del cliente (q también busca en la transcripción).
  cliente: opcional(z.string().trim().max(100)),
  vendedor: lista(z.coerce.number().int().positive()),
  desde: opcional(z.iso.date()),
  hasta: opcional(z.iso.date()),
  // stringbool y no coerce.boolean: con coerce, "false" sería true.
  closed: opcional(z.stringbool()),
  industria: lista(IndustriaSchema),
  canal: lista(CanalAdquisicionSchema),
  dolor: lista(DolorPrincipalSchema),
  tamano: lista(TamanoEmpresaSchema),
  casoUso: lista(CasoUsoSchema),
  integracion: lista(IntegracionSchema),
  canalAtencion: lista(CanalAtencionSchema),
});
export type Filtros = z.infer<typeof FiltrosSchema>;

// Inversa de FiltrosSchema: filtros → query string (listas separadas por coma).
export const filtrosAQuery = (filtros: Filtros): string => {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || (Array.isArray(valor) && valor.length === 0)) {
      continue;
    }
    params.set(clave, Array.isArray(valor) ? valor.join(',') : String(valor));
  }
  return params.toString();
};

export const OrdenListadoSchema = z.enum(['fecha_desc', 'fecha_asc', 'volumen_desc']);
export type OrdenListado = z.infer<typeof OrdenListadoSchema>;

export const ListadoSchema = FiltrosSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orden: OrdenListadoSchema.default('fecha_desc'),
});
export type Listado = z.infer<typeof ListadoSchema>;

export const DimensionCierreSchema = z.enum([
  'industria',
  'canal_adquisicion',
  'dolor_principal',
  'tamano_empresa',
  'vendedor',
]);
export type DimensionCierre = z.infer<typeof DimensionCierreSchema>;

export const CampoDemandaSchema = z.enum(['casos_uso', 'integraciones', 'canales_atencion']);
export type CampoDemanda = z.infer<typeof CampoDemandaSchema>;
