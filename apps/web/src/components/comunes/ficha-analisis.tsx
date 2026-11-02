import type { Analisis } from "@vambe/shared";
import { Badge } from "@/components/ui/badge";
import { type CampoEtiqueta, etiqueta, numero } from "@/lib/formato";

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="font-medium text-vambe-900">{valor}</p>
    </div>
  );
}

function Etiquetas({
  titulo,
  campo,
  valores,
}: {
  titulo: string;
  campo: CampoEtiqueta;
  valores: string[];
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{titulo}</p>
      {valores.length === 0 ? (
        <p className="text-sm text-muted-foreground">No menciona</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {valores.map((v) => (
            <Badge key={v} variant="secondary">
              {etiqueta(campo, v)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Lo que el LLM extrajo de una transcripción, con los labels legibles de shared.
export function FichaAnalisis({ analisis }: { analisis: Analisis }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Dato titulo="Industria" valor={etiqueta("industria", analisis.industria)} />
        <Dato
          titulo="Canal de adquisición"
          valor={etiqueta("canal_adquisicion", analisis.canal_adquisicion)}
        />
        <Dato
          titulo="Dolor principal"
          valor={etiqueta("dolor_principal", analisis.dolor_principal)}
        />
        <Dato
          titulo="Tamaño"
          valor={etiqueta("tamano_empresa", analisis.tamano_empresa ?? "sin_dato")}
        />
        <Dato
          titulo="Volumen mensual"
          valor={
            analisis.volumen_mensual === null
              ? "Sin dato"
              : `${numero(analisis.volumen_mensual)} consultas`
          }
        />
      </div>
      <Etiquetas titulo="Casos de uso" campo="casos_uso" valores={analisis.casos_uso} />
      <Etiquetas
        titulo="Integraciones"
        campo="integraciones"
        valores={analisis.integraciones}
      />
      <Etiquetas
        titulo="Canales de atención"
        campo="canales_atencion"
        valores={analisis.canales_atencion}
      />
    </div>
  );
}
