"use client";

import type { PuntoTendencia } from "@vambe/shared";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { mes, numero, pct } from "@/lib/formato";

const config = {
  tasa: { label: "Cierre", color: "var(--chart-1)" },
} satisfies ChartConfig;

// Tasa de cierre mensual; la cantidad de reuniones va en el tooltip (un solo eje).
export function LineaTendencia({ datos }: { datos: PuntoTendencia[] }) {
  if (datos.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No hay reuniones con estos filtros.
      </p>
    );
  }
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <LineChart data={datos} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="mes"
          tickFormatter={mes}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(v: number) => pct(v)}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                mes(String((payload[0]?.payload as PuntoTendencia).mes))
              }
              formatter={(valor, _nombre, item) => {
                const { n, tasa } = item.payload as PuntoTendencia;
                return (
                  <span>
                    Cierre {pct(Number(valor), 1)} · {numero(Math.round(tasa * n))}{" "}
                    reuniones cerradas de {numero(n)}
                  </span>
                );
              }}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="tasa"
          stroke="var(--color-tasa)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-tasa)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
