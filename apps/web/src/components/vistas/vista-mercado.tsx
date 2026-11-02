"use client";

import type { Demanda } from "@vambe/shared";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
import { BarrasDemanda } from "@/components/graficos/barras-demanda";
import { ConDatos } from "@/components/comunes/con-datos";
import { Encabezado } from "@/components/comunes/encabezado";
import { Tarjeta } from "@/components/comunes/tarjeta";
import { useApi } from "@/lib/api";
import { conQuery, useFiltros } from "@/lib/use-filtros";

function TablaDemanda({
  titulo,
  subtitulo,
  campo,
}: {
  titulo: string;
  subtitulo: string;
  campo: string;
}) {
  const { query } = useFiltros();
  const consulta = useApi<Demanda>(conQuery("/metricas/demanda", query, { campo }));
  return (
    <Tarjeta titulo={titulo} subtitulo={subtitulo}>
      <ConDatos consulta={consulta}>
        {(datos) => <BarrasDemanda datos={datos} />}
      </ConDatos>
    </Tarjeta>
  );
}

export function VistaMercado() {
  return (
    <>
      <Encabezado
        titulo="¿Qué pide el mercado?"
        descripcion="Qué funciones, integraciones y canales piden los clientes, y si pedirlos se asocia a cerrar más o menos que el promedio."
      />
      <BarraFiltros />
      <div className="grid grid-cols-2 gap-4">
        <TablaDemanda
          titulo="Casos de uso"
          subtitulo="Qué necesitan que haga el bot"
          campo="casos_uso"
        />
        <div className="grid gap-4">
          <TablaDemanda
            titulo="Integraciones"
            subtitulo="Con qué sistemas debe conectarse"
            campo="integraciones"
          />
          <TablaDemanda
            titulo="Canales de atención"
            subtitulo="Por dónde atienden o quieren atender (solo si lo mencionan)"
            campo="canales_atencion"
          />
        </div>
      </div>
    </>
  );
}
