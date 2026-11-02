"use client";

import type { ReactNode } from "react";
import type { SWRResponse } from "swr";
import { Button } from "@/components/ui/button";
import { Esqueleto } from "./tarjeta";

// Esqueleto mientras carga, error con reintento, y al refrescar mantiene los
// datos anteriores atenuados (sin saltos de layout).
export function ConDatos<T>({
  consulta,
  alto = "h-64",
  children,
}: {
  consulta: SWRResponse<T>;
  alto?: string;
  children: (datos: T) => ReactNode;
}) {
  const { data, error, isValidating, mutate } = consulta;

  if (error && !data) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-xl bg-destructive/10 text-sm text-destructive ${alto}`}
      >
        <p>No se pudieron cargar los datos: {(error as Error).message}</p>
        <Button variant="outline" size="sm" onClick={() => void mutate()}>
          Reintentar
        </Button>
      </div>
    );
  }
  if (!data) return <Esqueleto className={alto} />;

  return (
    <div className={isValidating ? "opacity-60 transition-opacity" : undefined}>
      {children(data)}
    </div>
  );
}
