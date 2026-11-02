import type { Segmento } from "@vambe/shared";
import {
  type CampoEtiqueta,
  etiqueta,
  extremos,
  pct,
  vsPromedio,
} from "@/lib/formato";

// La conclusión del gráfico en una frase, calculada desde los datos
// (solo con segmentos de muestra suficiente).
export function Lectura({
  segmentos,
  campo,
}: {
  segmentos: Segmento[];
  campo: CampoEtiqueta;
}) {
  const { mejor, peor } = extremos(segmentos);
  if (!mejor) return null;
  return (
    <p className="mb-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
      Cierra más: <strong>{etiqueta(campo, mejor.clave)}</strong> (
      {pct(mejor.tasa)}, {vsPromedio(mejor.delta)})
      {peor && (
        <>
          {" · "}cierra menos: <strong>{etiqueta(campo, peor.clave)}</strong> (
          {pct(peor.tasa)}, {vsPromedio(peor.delta)})
        </>
      )}
    </p>
  );
}
