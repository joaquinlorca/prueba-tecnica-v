import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaProbar } from "@/components/vistas/vista-probar";
import { Esqueleto } from "@/components/comunes/tarjeta";

export const metadata: Metadata = { title: "Probar el modelo" };

// La vista lee los filtros de la URL (useSearchParams): va dentro de Suspense.
export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto className="h-96" />}>
      <VistaProbar />
    </Suspense>
  );
}
