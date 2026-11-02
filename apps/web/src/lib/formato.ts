import {
  CANAL_ADQUISICION_LABELS,
  CANAL_ATENCION_LABELS,
  CASO_USO_LABELS,
  DOLOR_PRINCIPAL_LABELS,
  type EtiquetaCategoria,
  INDUSTRIA_LABELS,
  INTEGRACION_LABELS,
  type Segmento,
  TAMANO_EMPRESA_LABELS,
} from "@vambe/shared";

export type CampoEtiqueta =
  | "industria"
  | "canal_adquisicion"
  | "dolor_principal"
  | "tamano_empresa"
  | "vendedor"
  | "volumen"
  | "casos_uso"
  | "integraciones"
  | "canales_atencion";

const LABELS: Partial<Record<CampoEtiqueta, Record<string, EtiquetaCategoria>>> =
  {
    industria: INDUSTRIA_LABELS,
    canal_adquisicion: CANAL_ADQUISICION_LABELS,
    dolor_principal: DOLOR_PRINCIPAL_LABELS,
    tamano_empresa: TAMANO_EMPRESA_LABELS,
    casos_uso: CASO_USO_LABELS,
    integraciones: INTEGRACION_LABELS,
    canales_atencion: CANAL_ATENCION_LABELS,
  };

const TRAMOS: Record<string, string> = {
  "<500": "Menos de 500",
  "500-2k": "500 – 2.000",
  "2k-10k": "2.000 – 10.000",
  ">10k": "Más de 10.000",
};

export const etiqueta = (campo: CampoEtiqueta, clave: string) => {
  if (clave === "sin_dato") return "Sin dato";
  if (campo === "volumen") return TRAMOS[clave] ?? clave;
  return LABELS[campo]?.[clave]?.label ?? clave;
};

// Opciones para un <select> a partir de los labels de shared.
export const opciones = (campo: CampoEtiqueta) =>
  Object.entries(LABELS[campo] ?? {}).map(([valor, { label }]) => ({
    valor,
    label,
  }));

export const pct = (valor: number | null | undefined, decimales = 0) =>
  valor == null ? "—" : `${(valor * 100).toFixed(decimales)}%`;

// Diferencia contra la tasa promedio, en puntos porcentuales: 0.08 → "8 pts sobre el promedio".
export const vsPromedio = (delta: number) => {
  const valor = Math.round(delta * 100);
  if (valor === 0) return "igual al promedio";
  return `${Math.abs(valor)} pts ${valor > 0 ? "sobre" : "bajo"} el promedio`;
};

const formatoNumero = new Intl.NumberFormat("es-CL");
export const numero = (valor: number | null | undefined) =>
  valor == null ? "—" : formatoNumero.format(valor);

export const reuniones = (n: number) =>
  `${formatoNumero.format(n)} ${n === 1 ? "reunión" : "reuniones"}`;

const formatoFecha = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export const fecha = (iso: string) => formatoFecha.format(new Date(iso));

const formatoMes = new Intl.DateTimeFormat("es-CL", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
export const mes = (yyyyMm: string) => formatoMes.format(new Date(`${yyyyMm}-01`));

// Mejor y peor segmento con muestra suficiente: la "lectura" de cada gráfico.
// "Otro" y "Sin dato" mezclan casos distintos, así que no cuentan como segmento.
export const extremos = (segmentos: Segmento[]) => {
  const confiables = segmentos
    .filter(
      (s) => !s.muestraChica && s.clave !== "otro" && s.clave !== "sin_dato",
    )
    .sort((a, b) => b.tasa - a.tasa);
  return {
    mejor: confiables[0],
    peor: confiables.length > 1 ? confiables[confiables.length - 1] : undefined,
  };
};
