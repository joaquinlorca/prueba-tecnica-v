import { z } from 'zod';
import type { Analisis } from './analisis';
import type { CampoDemanda, DimensionCierre } from './filtros';
import type { Industria } from './taxonomia';

// Bajo este n una tasa de cierre no es confiable: la UI la muestra atenuada.
export const MUESTRA_MINIMA = 30;
// Con el free tier se analizan ~38 filas/min (medido): 1.000 filas ≈ 26 min de espera.
// No cuenta el encabezado: un CSV de 1.001 líneas tiene 1.000 filas.
export const MAX_FILAS_CARGA = 1000;

export const AnalizarTranscripcionSchema = z.object({
  transcripcion: z.string().trim().min(50).max(3000),
});
export type AnalizarTranscripcion = z.infer<typeof AnalizarTranscripcionSchema>;

export type EstadoAnalisis = 'pendiente' | 'ok' | 'error';

export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReunionResumen {
  id: number;
  cliente: string;
  email: string;
  vendedor: string;
  fecha: string;
  closed: boolean;
  estadoAnalisis: EstadoAnalisis;
  analisis: Analisis | null;
  extracto: string;
}

export interface ReunionDetalle extends Omit<ReunionResumen, 'extracto'> {
  telefono: string | null;
  transcripcion: string;
  promptVersion: string | null;
  modelo: string | null;
}

export interface Catalogos {
  vendedores: { id: number; nombre: string }[];
}

export interface ResumenMetricas {
  total: number;
  cerradas: number;
  tasaCierre: number | null;
  analizadas: number;
  pendientes: number;
  errores: number;
  medianaVolumen: number | null;
  fechaMin: string | null;
  fechaMax: string | null;
}

export interface Segmento {
  clave: string;
  n: number;
  cerradas: number;
  tasa: number;
  // Diferencia (en proporción) contra la tasa del conjunto filtrado.
  delta: number;
  muestraChica: boolean;
}

export interface Segmentacion {
  tasaBase: number | null;
  segmentos: Segmento[];
}

export interface CierrePorDimension extends Segmentacion {
  dimension: DimensionCierre;
}

// Tramos de volumen mensual, en el orden en que se muestran.
export const TRAMOS_VOLUMEN = ['<500', '500-2k', '2k-10k', '>10k', 'sin_dato'] as const;

export interface DemandaItem {
  clave: string;
  n: number;
  pctReuniones: number;
  tasaCierre: number;
}

export interface Demanda {
  campo: CampoDemanda;
  analizadas: number;
  tasaBase: number | null;
  items: DemandaItem[];
}

export interface CeldaVendedorIndustria {
  vendedor: string;
  industria: Industria;
  n: number;
  tasa: number;
}

export interface RendimientoVendedores extends Segmentacion {
  celdas: CeldaVendedorIndustria[];
}

export interface PuntoTendencia {
  mes: string;
  n: number;
  tasa: number;
}

export interface CargaCreada {
  total: number;
}

export interface EstadoCarga {
  estado: 'sin_cargas' | 'procesando' | 'terminada';
  total: number;
  ok: number;
  error: number;
  pendientes: number;
  iniciadaEn: string | null;
  etaMin: number | null;
}

export interface DatosEliminados {
  eliminadas: {
    reuniones: number;
    clientes: number;
    analisis: number;
    vendedores: number;
  };
}
