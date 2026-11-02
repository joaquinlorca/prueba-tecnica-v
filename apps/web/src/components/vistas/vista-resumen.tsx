"use client";

import {
  type CierrePorDimension,
  MUESTRA_MINIMA,
  type PuntoTendencia,
  type ResumenMetricas,
  type Segmento,
} from "@vambe/shared";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
import { LineaTendencia } from "@/components/graficos/linea-tendencia";
import { ConDatos } from "@/components/comunes/con-datos";
import { Encabezado } from "@/components/comunes/encabezado";
import { Kpi } from "@/components/comunes/kpi";
import { Esqueleto, Tarjeta } from "@/components/comunes/tarjeta";
import { useApi } from "@/lib/api";
import {
  type CampoEtiqueta,
  etiqueta,
  fecha,
  numero,
  pct,
  reuniones,
  vsPromedio,
} from "@/lib/formato";
import { conQuery, useFiltros } from "@/lib/use-filtros";

const NOMBRE_DIMENSION: Record<string, string> = {
  industria: "Industria",
  canal_adquisicion: "Canal",
  dolor_principal: "Dolor",
  tamano_empresa: "Tamaño",
};

interface Hallazgo extends Segmento {
  dimension: CampoEtiqueta;
}

function ListaHallazgos({
  titulo,
  hallazgos,
  positivo,
  tasaBase,
}: {
  titulo: string;
  hallazgos: Hallazgo[];
  positivo: boolean;
  tasaBase: number | null;
}) {
  return (
    <Tarjeta
      titulo={titulo}
      subtitulo={
        tasaBase === null
          ? undefined
          : `Comparado con el promedio de ${pct(tasaBase)}. Solo segmentos con ${MUESTRA_MINIMA} o más reuniones.`
      }
    >
      {hallazgos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay segmentos con muestra suficiente.
        </p>
      ) : (
        <ul className="space-y-3">
          {hallazgos.map((h) => (
            <li
              key={`${h.dimension}:${h.clave}`}
              className="flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs text-muted-foreground">
                  {NOMBRE_DIMENSION[h.dimension]}
                </p>
                <p className="font-medium text-foreground">
                  {etiqueta(h.dimension, h.clave)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-vambe-900">{pct(h.tasa)}</p>
                <p
                  className={`text-xs ${positivo ? "text-emerald-700" : "text-destructive"}`}
                >
                  {vsPromedio(h.delta)} · {reuniones(h.n)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

export function VistaResumen() {
  const { query } = useFiltros();
  const resumen = useApi<ResumenMetricas>(conQuery("/metricas/resumen", query));
  const tendencia = useApi<PuntoTendencia[]>(
    conQuery("/metricas/tendencia", query),
  );
  const cierre = (dimension: string) =>
    conQuery("/metricas/cierre", query, { dimension });
  const industria = useApi<CierrePorDimension>(cierre("industria"));
  const canal = useApi<CierrePorDimension>(cierre("canal_adquisicion"));
  const dolor = useApi<CierrePorDimension>(cierre("dolor_principal"));
  const tamano = useApi<CierrePorDimension>(cierre("tamano_empresa"));

  const dimensiones = [industria.data, canal.data, dolor.data, tamano.data];
  const cargando = dimensiones.some((d) => !d);
  const hallazgos: Hallazgo[] = dimensiones
    .flatMap((d) =>
      d
        ? d.segmentos.map((s) => ({
            ...s,
            dimension: d.dimension as CampoEtiqueta,
          }))
        : [],
    )
    .filter((s) => !s.muestraChica && s.clave !== "otro" && s.clave !== "sin_dato")
    .sort((a, b) => b.delta - a.delta);

  return (
    <>
      <Encabezado
        titulo="Resumen comercial"
        descripcion="Reuniones de venta analizadas con IA. Los filtros aplican a todo el dashboard y se mantienen al cambiar de página."
      />
      <BarraFiltros />

      <ConDatos consulta={resumen} alto="h-28">
        {(r) => (
          <div className="mb-6 grid grid-cols-4 gap-4">
            <Kpi
              etiqueta="Reuniones"
              valor={numero(r.total)}
              detalle={
                r.fechaMin && r.fechaMax
                  ? `${fecha(r.fechaMin)} – ${fecha(r.fechaMax)}`
                  : undefined
              }
            />
            <Kpi
              etiqueta="Tasa de cierre"
              valor={pct(r.tasaCierre, 1)}
              detalle={`${numero(r.cerradas)} reuniones cerradas`}
            />
            <Kpi
              etiqueta="Volumen mensual típico"
              valor={numero(r.medianaVolumen)}
              detalle="Mediana de consultas/mes que reciben los clientes"
            />
            <Kpi
              etiqueta="Analizadas por IA"
              // 1 decimal: 1.499 de 1.500 no debe verse como 100%.
              valor={pct(r.total ? r.analizadas / r.total : null, 1)}
              detalle={`${numero(r.analizadas)} ok · ${numero(r.pendientes)} pendientes · ${numero(r.errores)} con error`}
            />
          </div>
        )}
      </ConDatos>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {cargando ? (
          <>
            <Esqueleto className="h-56" />
            <Esqueleto className="h-56" />
          </>
        ) : (
          <>
            <ListaHallazgos
              titulo="Segmentos que más cierran"
              hallazgos={hallazgos.filter((h) => h.delta > 0).slice(0, 4)}
              positivo
              tasaBase={industria.data?.tasaBase ?? null}
            />
            <ListaHallazgos
              titulo="Segmentos que menos cierran"
              hallazgos={hallazgos
                .filter((h) => h.delta < 0)
                .slice(-4)
                .reverse()}
              positivo={false}
              tasaBase={industria.data?.tasaBase ?? null}
            />
          </>
        )}
      </div>

      <Tarjeta
        titulo="Tasa de cierre por mes"
        subtitulo="Pasa el cursor para ver cuántas reuniones se cerraron cada mes."
      >
        <ConDatos consulta={tendencia}>
          {(puntos) => <LineaTendencia datos={puntos} />}
        </ConDatos>
      </Tarjeta>

    </>
  );
}
