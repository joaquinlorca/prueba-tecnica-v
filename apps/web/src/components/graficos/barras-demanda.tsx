"use client";

import type { Demanda } from "@vambe/shared";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CampoEtiqueta,
  etiqueta,
  pct,
  reuniones,
  vsPromedio,
} from "@/lib/formato";

// Cuánto se pide cada necesidad (barra) y si pedirla se asocia a cerrar (columna derecha).
export function BarrasDemanda({ datos }: { datos: Demanda }) {
  if (datos.items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nadie lo mencionó con estos filtros.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Necesidad</TableHead>
          <TableHead>% de reuniones</TableHead>
          <TableHead className="text-right">Tasa de cierre</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {datos.items.map((item) => {
          const delta =
            datos.tasaBase === null ? 0 : item.tasaCierre - datos.tasaBase;
          return (
            <TableRow key={item.clave}>
              <TableCell className="w-40 whitespace-normal">
                {etiqueta(datos.campo as CampoEtiqueta, item.clave)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={item.pctReuniones * 100} className="flex-1" />
                  <span className="w-28 text-right text-xs tabular-nums text-muted-foreground">
                    {pct(item.pctReuniones)} · {reuniones(item.n)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <p className="font-medium">{pct(item.tasaCierre)}</p>
                <p
                  className={`text-xs ${delta >= 0.02 ? "text-emerald-700" : delta <= -0.02 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {vsPromedio(delta)}
                </p>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
