"use client";

import { INDUSTRIA_LABELS, MUESTRA_MINIMA, type RendimientoVendedores } from "@vambe/shared";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { pct, reuniones } from "@/lib/formato";

// Escala de un solo tono (azul Vambe): más oscuro = cierra más.
const colorCelda = (tasa: number, min: number, max: number) => {
  const t = max > min ? (tasa - min) / (max - min) : 0.5;
  const claro = [227, 238, 252];
  const oscuro = [1, 49, 115];
  const [r, g, b] = claro.map((c, i) => Math.round(c + (oscuro[i] - c) * t));
  return { fondo: `rgb(${r} ${g} ${b})`, texto: t > 0.55 ? "#fff" : "#00204f" };
};

// Vendedor × industria: en qué segmento cierra mejor cada vendedor.
export function HeatmapVendedores({ datos }: { datos: RendimientoVendedores }) {
  const vendedores = datos.segmentos.map((s) => s.clave);
  const industrias = [...new Set(datos.celdas.map((c) => c.industria))].sort(
    (a, b) => INDUSTRIA_LABELS[a].label.localeCompare(INDUSTRIA_LABELS[b].label),
  );
  const celda = new Map(
    datos.celdas.map((c) => [`${c.vendedor}:${c.industria}`, c]),
  );
  const confiables = datos.celdas.filter((c) => c.n >= MUESTRA_MINIMA / 3);
  const tasas = (confiables.length ? confiables : datos.celdas).map((c) => c.tasa);
  const min = Math.min(...tasas);
  const max = Math.max(...tasas);

  if (datos.celdas.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No hay reuniones con estos filtros.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 text-xs">
        <thead>
          <tr>
            <th className="w-44" />
            {vendedores.map((v) => (
              <th key={v} className="px-2 pb-2 text-center font-semibold text-foreground">
                {v}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {industrias.map((industria) => (
            <tr key={industria}>
              <th className="py-1 pr-3 text-left font-normal text-muted-foreground">
                {INDUSTRIA_LABELS[industria].label}
              </th>
              {vendedores.map((vendedor) => {
                const c = celda.get(`${vendedor}:${industria}`);
                if (!c) {
                  return (
                    <td key={vendedor} className="rounded bg-muted/50 py-2 text-center text-muted-foreground">
                      —
                    </td>
                  );
                }
                // Con muy pocas reuniones la tasa no dice nada: se muestra en gris.
                const pocas = c.n < MUESTRA_MINIMA / 3;
                const { fondo, texto } = colorCelda(c.tasa, min, max);
                return (
                  <Tooltip key={vendedor}>
                    <TooltipTrigger asChild>
                      <td
                        className="cursor-default rounded py-2 text-center tabular-nums"
                        style={
                          pocas
                            ? { background: "var(--muted)", color: "var(--muted-foreground)" }
                            : { background: fondo, color: texto }
                        }
                      >
                        {pct(c.tasa)}
                        <span className="block text-[10px] opacity-70">
                          {reuniones(c.n)}
                        </span>
                      </td>
                    </TooltipTrigger>
                    <TooltipContent>
                      {vendedor} · {INDUSTRIA_LABELS[industria].label}:{" "}
                      {pct(c.tasa, 1)} de cierre en {reuniones(c.n)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-foreground">
        Más oscuro = mayor tasa de cierre. En gris, celdas con menos de{" "}
        {Math.ceil(MUESTRA_MINIMA / 3)} reuniones (no concluyentes).
      </p>
    </div>
  );
}
