import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaMercado } from "@/components/vistas/vista-mercado";
import { Esqueleto } from "@/components/comunes/tarjeta";

export const metadata: Metadata = { title: "¿Qué pide el mercado?" };

// La vista lee los filtros de la URL (useSearchParams): va dentro de Suspense.
export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto className="h-96" />}>
      <VistaMercado />
    </Suspense>
  );
}
