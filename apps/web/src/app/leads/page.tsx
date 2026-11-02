import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaLeads } from "@/components/vistas/vista-leads";
import { Esqueleto } from "@/components/comunes/tarjeta";

export const metadata: Metadata = { title: "¿Qué leads cierran?" };

// La vista lee los filtros de la URL (useSearchParams): va dentro de Suspense.
export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto className="h-96" />}>
      <VistaLeads />
    </Suspense>
  );
}
