"use client";

import { MUESTRA_MINIMA, type Segmentacion } from "@vambe/shared";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  type CampoEtiqueta,
  etiqueta,
  numero,
  pct,
  reuniones,
  vsPromedio,
} from "@/lib/formato";

const config = {
  tasa: { label: "Tasa de cierre", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface Fila {
  nombre: string;
  tasa: number;
  n: number;
  cerradas: number;
  delta: number;
  muestraChica: boolean;
}

function DetalleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Fila }[];
}) {
  const fila = payload?.[0]?.payload;
  if (!active || !fila) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{fila.nombre}</p>
      <p className="text-muted-foreground">
        Cierre {pct(fila.tasa, 1)} · {vsPromedio(fila.delta)}
      </p>
      <p className="text-muted-foreground">
        {numero(fila.cerradas)} cerradas de {reuniones(fila.n)}
      </p>
      {fila.muestraChica && (
        <p className="mt-1 text-amber-700">
          Menos de {MUESTRA_MINIMA} reuniones
        </p>
      )}
    </div>
  );
}

// Tasa de cierre por segmento, con una línea en el promedio del conjunto filtrado.
// Los segmentos con muestra chica se ven atenuados.
export function BarrasCierre({
  datos,
  campo,
}: {
  datos: Segmentacion;
  campo: CampoEtiqueta;
}) {
  // Ordenadas de mayor a menor cierre; los tramos de volumen mantienen su orden.
  const segmentos =
    campo === "volumen"
      ? datos.segmentos
      : [...datos.segmentos].sort((a, b) => b.tasa - a.tasa);
  const filas: Fila[] = segmentos.map((s) => ({
    nombre: etiqueta(campo, s.clave),
    tasa: s.tasa,
    n: s.n,
    cerradas: s.cerradas,
    delta: s.delta,
    muestraChica: s.muestraChica,
  }));

  if (filas.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No hay reuniones con estos filtros.
      </p>
    );
  }

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: filas.length * 34 + 40 }}
    >
      <BarChart
        data={filas}
        layout="vertical"
        margin={{ top: 16, right: 48, bottom: 0, left: 0 }}
      >
        <XAxis
          type="number"
          domain={[0, 1]}
          tickFormatter={(v: number) => pct(v)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          width={170}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip content={<DetalleTooltip />} />
        {datos.tasaBase !== null && (
          <ReferenceLine
            x={datos.tasaBase}
            stroke="var(--chart-3)"
            strokeDasharray="4 3"
            label={{
              value: `Promedio ${pct(datos.tasaBase)}`,
              position: "top",
              fontSize: 11,
              fill: "var(--chart-3)",
            }}
          />
        )}
        <Bar dataKey="tasa" barSize={18} radius={[0, 4, 4, 0]}>
          {filas.map((fila) => (
            <Cell
              key={fila.nombre}
              fill={fila.muestraChica ? "var(--chart-2)" : "var(--color-tasa)"}
            />
          ))}
          <LabelList
            dataKey="tasa"
            position="right"
            formatter={(v: unknown) => pct(Number(v))}
            className="fill-foreground"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
