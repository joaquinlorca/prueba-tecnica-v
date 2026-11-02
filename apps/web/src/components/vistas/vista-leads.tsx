"use client";

import type { CierrePorDimension, Segmentacion } from "@vambe/shared";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
import { BarrasCierre } from "@/components/graficos/barras-cierre";
import { ConDatos } from "@/components/comunes/con-datos";
import { Encabezado } from "@/components/comunes/encabezado";
import { Lectura } from "@/components/comunes/lectura";
import { Tarjeta } from "@/components/comunes/tarjeta";
import { useApi } from "@/lib/api";
import type { CampoEtiqueta } from "@/lib/formato";
import { conQuery, useFiltros } from "@/lib/use-filtros";

function GraficoCierre({
  titulo,
  subtitulo,
  ruta,
  campo,
}: {
  titulo: string;
  subtitulo: string;
  ruta: string;
  campo: CampoEtiqueta;
}) {
  const consulta = useApi<Segmentacion | CierrePorDimension>(ruta);
  return (
    <Tarjeta titulo={titulo} subtitulo={subtitulo}>
      <ConDatos consulta={consulta}>
        {(datos) => (
          <>
            <Lectura segmentos={datos.segmentos} campo={campo} />
            <BarrasCierre datos={datos} campo={campo} />
          </>
        )}
      </ConDatos>
    </Tarjeta>
  );
}

export function VistaLeads() {
  const { query } = useFiltros();
  const cierre = (dimension: string) =>
    conQuery("/metricas/cierre", query, { dimension });

  return (
    <>
      <Encabezado
        titulo="¿Qué leads cierran?"
        descripcion="Tasa de cierre de cada segmento comparada con el promedio"
      />
      <BarraFiltros />
      <div className="grid grid-cols-2 gap-4">
        <GraficoCierre
          titulo="Por industria"
          subtitulo="Rubro del cliente, inferido de la transcripción"
          ruta={cierre("industria")}
          campo="industria"
        />
        <GraficoCierre
          titulo="Por canal de adquisición"
          subtitulo="Cómo conoció Vambe"
          ruta={cierre("canal_adquisicion")}
          campo="canal_adquisicion"
        />
        <GraficoCierre
          titulo="Por dolor principal"
          subtitulo="El problema que más le urge resolver"
          ruta={cierre("dolor_principal")}
          campo="dolor_principal"
        />
        <GraficoCierre
          titulo="Por tamaño de empresa"
          subtitulo="Inferido de sucursales, empleados o volumen"
          ruta={cierre("tamano_empresa")}
          campo="tamano_empresa"
        />
        <GraficoCierre
          titulo="Por volumen de consultas"
          subtitulo="Consultas mensuales que recibe el cliente"
          ruta={conQuery("/metricas/volumen", query)}
          campo="volumen"
        />
      </div>
    </>
  );
}
