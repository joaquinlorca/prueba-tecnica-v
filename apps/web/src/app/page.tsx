import { Suspense } from "react";
import { VistaResumen } from "@/components/vistas/vista-resumen";
import { Esqueleto } from "@/components/comunes/tarjeta";

// La vista lee los filtros de la URL (useSearchParams): va dentro de Suspense.
export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto className="h-96" />}>
      <VistaResumen />
    </Suspense>
  );
}
