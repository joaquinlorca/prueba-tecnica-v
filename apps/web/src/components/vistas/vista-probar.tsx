"use client";

import {
  type Analisis,
  type CargaCreada,
  type DatosEliminados,
  type EstadoCarga,
  MAX_FILAS_CARGA,
} from "@vambe/shared";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useSWRConfig } from "swr";
import { Encabezado } from "@/components/comunes/encabezado";
import { FichaAnalisis } from "@/components/comunes/ficha-analisis";
import { Tarjeta } from "@/components/comunes/tarjeta";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { pedir, useApi } from "@/lib/api";
import { numero, reuniones } from "@/lib/formato";

const EJEMPLO =
  "Tenemos una cadena de tres pastelerías en Concepción. Recibimos unas 80 consultas al día por Instagram y WhatsApp sobre pedidos de tortas personalizadas, precios y horarios. Nos recomendó Vambe otra pastelería amiga. Perdemos pedidos porque no alcanzamos a responder a tiempo, sobre todo los fines de semana. Queremos que el bot cotice tortas, tome pedidos y se conecte con nuestro sistema de pagos.";

function AnalizarTranscripcion() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<Analisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const largo = texto.trim().length;

  const analizar = async (evento: FormEvent) => {
    evento.preventDefault();
    setCargando(true);
    setError(null);
    try {
      setResultado(
        await pedir<Analisis>("/analisis", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcripcion: texto }),
        }),
      );
    } catch (e) {
      setResultado(null);
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Tarjeta
      titulo="Analizar una transcripción"
      subtitulo="Pega lo que dijo un cliente y Gemma 4 lo categoriza (no se guarda)."
    >
      <form onSubmit={analizar} className="space-y-3">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={7}
          maxLength={3000}
          placeholder="Ej: Somos una clínica dental con tres sedes…"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={() => setTexto(EJEMPLO)}
          >
            Usar un ejemplo
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {largo}/3000 (mín. 50)
            </span>
            <Button type="submit" size="lg" disabled={cargando || largo < 50}>
              {cargando ? "Analizando…" : "Analizar"}
            </Button>
          </div>
        </div>
      </form>
      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {resultado && (
        <>
          <Separator className="my-5" />
          <FichaAnalisis analisis={resultado} />
        </>
      )}
    </Tarjeta>
  );
}

const tituloProgreso = ({ estado, origen }: EstadoCarga) => {
  const reanudacion = origen === "reanudacion";
  if (estado === "procesando") {
    return reanudacion
      ? "Retomando reuniones pendientes…"
      : "Analizando con Gemma 4…";
  }
  return reanudacion
    ? "Reuniones pendientes analizadas"
    : "Última carga terminada";
};

function SubirCsv() {
  const { mutate } = useSWRConfig();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [siguiendo, setSiguiendo] = useState(false);

  // Mientras hay una carga en proceso se consulta el progreso cada 3 s.
  const estado = useApi<EstadoCarga>("/cargas/actual", {
    refreshInterval: (datos) => (datos?.estado === "procesando" ? 3000 : 0),
    onSuccess: (datos) => {
      if (siguiendo && datos.estado === "terminada") {
        setSiguiendo(false);
        // Refresca todas las métricas del dashboard con las reuniones nuevas.
        void mutate(() => true);
      }
    },
  });

  const subir = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!archivo) return;
    const datos = new FormData();
    datos.append("archivo", archivo);
    setEnviando(true);
    setError(null);
    try {
      await pedir<CargaCreada>("/cargas", { method: "POST", body: datos });
      setSiguiendo(true);
      await estado.mutate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const carga = estado.data;
  const procesadas = carga ? carga.ok + carga.error : 0;
  const progreso = carga?.total ? procesadas / carga.total : 0;
  const procesando = carga?.estado === "procesando";

  return (
    <Tarjeta
      titulo="Subir un CSV de reuniones"
      subtitulo={`Hasta ${MAX_FILAS_CARGA} filas. Se guardan y se analizan en segundo plano; el dashboard se actualiza al terminar.`}
    >
      <form onSubmit={subir} className="space-y-3">
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        />
        <Button
          type="submit"
          size="lg"
          disabled={!archivo || enviando || procesando}
        >
          {enviando ? "Subiendo…" : "Subir y analizar"}
        </Button>
      </form>

      {error && (
        <p className="mt-4 whitespace-pre-line rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {carga && carga.estado !== "sin_cargas" && (
        <div>
          <Separator className="my-5" />
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">
              {tituloProgreso(carga)}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {numero(procesadas)} / {numero(carga.total)}
            </span>
          </div>
          <Progress value={progreso * 100} />
          <p className="mt-2 text-xs text-muted-foreground">
            {numero(carga.ok)} ok · {numero(carga.error)} con error
            {procesando &&
              (carga.etaMin !== null
                ? ` · ~${carga.etaMin} min restantes`
                : " · calculando tiempo restante…")}
          </p>
          {!procesando && (
            <Button asChild variant="link" className="mt-2 px-0">
              <Link href="/">Ver el dashboard actualizado →</Link>
            </Button>
          )}
        </div>
      )}
    </Tarjeta>
  );
}

function EmpezarDesdeCero() {
  const { mutate } = useSWRConfig();
  const [borrando, setBorrando] = useState(false);
  const [resultado, setResultado] = useState<{
    ok: boolean;
    texto: string;
  } | null>(null);

  const borrar = async () => {
    setBorrando(true);
    setResultado(null);
    try {
      const { eliminadas } = await pedir<DatosEliminados>("/datos", {
        method: "DELETE",
      });
      setResultado({
        ok: true,
        texto: `Se eliminaron ${reuniones(eliminadas.reuniones)}. La base está vacía: ya puedes subir un CSV.`,
      });
      // Todo el dashboard (métricas, catálogos, cargas) vuelve a consultar la API.
      void mutate(() => true);
    } catch (e) {
      setResultado({ ok: false, texto: (e as Error).message });
    } finally {
      setBorrando(false);
    }
  };

  return (
    <Tarjeta
      titulo="Empezar desde cero"
      subtitulo="Borra todas las reuniones, clientes, vendedores y análisis de la base."
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="lg" disabled={borrando}>
            {borrando ? "Eliminando…" : "Eliminar todos los datos"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar todos los datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán todas las reuniones y sus análisis. El dashboard
              quedará vacío hasta que subas un CSV. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void borrar()}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {resultado && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}
        >
          {resultado.texto}
        </p>
      )}
    </Tarjeta>
  );
}

export function VistaProbar() {
  return (
    <>
      <Encabezado
        titulo="Probar el modelo"
        descripcion="Aquí puedes comprobar que la categorización funciona en vivo: con una transcripción suelta o subiendo un CSV con el mismo formato del original. También puedes borrar todos los datos de la base para empezar desde cero."
      />
      <div className="grid grid-cols-2 items-start gap-4">
        <AnalizarTranscripcion />
        <div className="grid gap-4">
          <SubirCsv />
          <EmpezarDesdeCero />
        </div>
      </div>
    </>
  );
}
