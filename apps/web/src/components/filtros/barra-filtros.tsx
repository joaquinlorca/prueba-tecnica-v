"use client";

import type { Catalogos } from "@vambe/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/lib/api";
import { type CampoEtiqueta, opciones } from "@/lib/formato";
import { type ClaveFiltro, useFiltros } from "@/lib/use-filtros";

// Radix Select no admite "" como valor: "Todos" usa un valor centinela.
const TODOS = "__todos__";

function Selector({
  clave,
  etiqueta,
  items,
}: {
  clave: ClaveFiltro;
  etiqueta: string;
  items: { valor: string; label: string }[];
}) {
  const { valor, cambiar } = useFiltros();
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{etiqueta}</Label>
      <Select
        value={valor(clave) || TODOS}
        onValueChange={(v) => cambiar(clave, v === TODOS ? undefined : v)}
      >
        <SelectTrigger className="w-full bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {items.map(({ valor: v, label }) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const DIMENSIONES: {
  clave: ClaveFiltro;
  etiqueta: string;
  campo: CampoEtiqueta;
}[] = [
  { clave: "industria", etiqueta: "Industria", campo: "industria" },
  { clave: "canal", etiqueta: "Canal", campo: "canal_adquisicion" },
  { clave: "dolor", etiqueta: "Dolor principal", campo: "dolor_principal" },
  { clave: "tamano", etiqueta: "Tamaño", campo: "tamano_empresa" },
];

// Una sola fila de filtros que aplica a todos los gráficos de la página.
export function BarraFiltros() {
  const { valor, cambiar, limpiar, hayFiltros } = useFiltros();
  const catalogos = useApi<Catalogos>("/catalogos");

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-3">
          <Selector
            clave="vendedor"
            etiqueta="Vendedor"
            items={(catalogos.data?.vendedores ?? []).map((v) => ({
              valor: String(v.id),
              label: v.nombre,
            }))}
          />
          {DIMENSIONES.map(({ clave, etiqueta, campo }) => (
            <Selector
              key={clave}
              clave={clave}
              etiqueta={etiqueta}
              items={opciones(campo)}
            />
          ))}
          <Selector
            clave="closed"
            etiqueta="Resultado"
            items={[
              { valor: "true", label: "Cerradas" },
              { valor: "false", label: "No cerradas" },
            ]}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              disabled={!hayFiltros}
              onClick={limpiar}
            >
              Limpiar
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {(["desde", "hasta"] as const).map((clave) => (
            <div key={clave} className="flex items-center gap-2">
              <Label htmlFor={clave} className="text-xs text-muted-foreground">
                {clave === "desde" ? "Desde" : "Hasta"}
              </Label>
              <Input
                id={clave}
                type="date"
                className="w-40"
                value={valor(clave)}
                onChange={(e) => cambiar(clave, e.target.value || undefined)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
