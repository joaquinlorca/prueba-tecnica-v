"use client";

import { type Filtros, FiltrosSchema, filtrosAQuery } from "@vambe/shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type ClaveFiltro = keyof Filtros;

// Los filtros viven en la URL: se comparten entre páginas y los links se pueden compartir.
export function useFiltros() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filtros = useMemo<Filtros>(() => {
    const resultado = FiltrosSchema.safeParse(Object.fromEntries(searchParams));
    return resultado.success ? resultado.data : {};
  }, [searchParams]);

  const cambiar = useCallback(
    (clave: ClaveFiltro, valor: string | undefined) => {
      const params = new URLSearchParams(searchParams);
      if (valor) params.set(clave, valor);
      else params.delete(clave);
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const limpiar = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [pathname, router],
  );

  const query = filtrosAQuery(filtros);

  return {
    filtros,
    query,
    valor: (clave: ClaveFiltro) => searchParams.get(clave) ?? "",
    cambiar,
    limpiar,
    hayFiltros: query !== "",
  };
}

// "/metricas/cierre" + { dimension: "industria" } + filtros → URL para la API.
export const conQuery = (
  ruta: string,
  query: string,
  extra?: Record<string, string>,
) => {
  const params = new URLSearchParams(query);
  for (const [clave, valor] of Object.entries(extra ?? {})) {
    params.set(clave, valor);
  }
  const texto = params.toString();
  return texto ? `${ruta}?${texto}` : ruta;
};
