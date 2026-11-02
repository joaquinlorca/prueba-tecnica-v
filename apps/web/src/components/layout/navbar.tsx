"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "./logo";

const ENLACES = [
  { href: "/", label: "Resumen", conFiltros: true },
  { href: "/leads", label: "¿Qué leads cierran?", conFiltros: true },
  { href: "/vendedores", label: "Vendedores", conFiltros: true },
  { href: "/mercado", label: "¿Qué pide el mercado?", conFiltros: true },
  { href: "/reuniones", label: "Reuniones", conFiltros: true },
  { href: "/probar", label: "Probar el modelo", conFiltros: false },
];

function Enlaces({ activo, query }: { activo: string; query: string }) {
  return (
    <ul className="flex gap-1">
      {ENLACES.map(({ href, label, conFiltros }) => (
        <li key={href}>
          <Link
            // Las páginas de análisis conservan los filtros al navegar entre ellas.
            href={conFiltros && query ? `${href}?${query}` : href}
            className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activo === href
                ? "bg-white/15 text-white"
                : "text-vambe-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EnlacesActivos() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <Enlaces activo={pathname} query={searchParams.toString()} />;
}

export function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-vambe-950 via-vambe-900 to-vambe-700">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="Inicio">
          <Logo />
        </Link>
        <Suspense fallback={<Enlaces activo="" query="" />}>
          <EnlacesActivos />
        </Suspense>
      </div>
    </nav>
  );
}
