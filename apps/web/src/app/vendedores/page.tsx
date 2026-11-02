import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaVendedores } from "@/components/vistas/vista-vendedores";
import { Esqueleto } from "@/components/comunes/tarjeta";

export const metadata: Metadata = { title: "Vendedores" };

// La vista lee los filtros de la URL (useSearchParams): va dentro de Suspense.
export default function Pagina() {
  return (
    <Suspense fallback={<Esqueleto className="h-96" />}>
      <VistaVendedores />
    </Suspense>
  );
}
