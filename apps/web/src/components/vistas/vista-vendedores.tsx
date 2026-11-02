"use client";

import type { RendimientoVendedores } from "@vambe/shared";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
import { BarrasCierre } from "@/components/graficos/barras-cierre";
import { HeatmapVendedores } from "@/components/graficos/heatmap-vendedores";
import { ConDatos } from "@/components/comunes/con-datos";
import { Encabezado } from "@/components/comunes/encabezado";
import { Lectura } from "@/components/comunes/lectura";
import { Tarjeta } from "@/components/comunes/tarjeta";
import { useApi } from "@/lib/api";
import { conQuery, useFiltros } from "@/lib/use-filtros";

export function VistaVendedores() {
  const { query } = useFiltros();
  const consulta = useApi<RendimientoVendedores>(
    conQuery("/metricas/vendedores", query),
  );

  return (
    <>
      <Encabezado
        titulo="¿Cómo rinde cada vendedor?"
        descripcion="Tasa de cierre por vendedor y en qué industrias le va mejor a cada uno: útil para asignar cada lead a quien mejor lo cierra."
      />
      <BarraFiltros />
      <div className="grid grid-cols-[2fr_3fr] gap-4">
        <Tarjeta titulo="Ranking de vendedores" subtitulo="Todas las reuniones del filtro">
          <ConDatos consulta={consulta}>
            {(datos) => (
              <>
                <Lectura segmentos={datos.segmentos} campo="vendedor" />
                <BarrasCierre datos={datos} campo="vendedor" />
              </>
            )}
          </ConDatos>
        </Tarjeta>
        <Tarjeta
          titulo="Vendedor × industria"
          subtitulo="Tasa de cierre de cada vendedor en cada industria"
        >
          <ConDatos consulta={consulta} alto="h-96">
            {(datos) => <HeatmapVendedores datos={datos} />}
          </ConDatos>
        </Tarjeta>
      </div>
    </>
  );
}
