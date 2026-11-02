import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaReuniones } from "@/components/vistas/vista-reuniones";
import { Esqueleto } from "@/components/comunes/tarjeta";

export const metadata: Metadata = { title: "Reuniones" };

// La vista lee los filtros de la URL (useSearchParams): va dentro de Suspense.
export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto className="h-96" />}>
      <VistaReuniones />
    </Suspense>
  );
}
