"use client";

import type {
  OrdenListado,
  Paginado,
  ReunionDetalle,
  ReunionResumen,
} from "@vambe/shared";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ConDatos } from "@/components/comunes/con-datos";
import { Encabezado } from "@/components/comunes/encabezado";
import { FichaAnalisis } from "@/components/comunes/ficha-analisis";
import { Tarjeta } from "@/components/comunes/tarjeta";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/lib/api";
import { etiqueta, fecha, numero } from "@/lib/formato";
import { conQuery, useFiltros } from "@/lib/use-filtros";

const POR_PAGINA = 20;

function EstadoCierre({ closed }: { closed: boolean }) {
  return closed ? (
    <Badge className="bg-emerald-50 text-emerald-700">Cerrada</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      No cerrada
    </Badge>
  );
}

function DetalleReunion({ id }: { id: number }) {
  const consulta = useApi<ReunionDetalle>(`/reuniones/${id}`);
  return (
    <ConDatos consulta={consulta} alto="h-96">
      {(r) => (
        <>
          <SheetHeader>
            <p className="text-xs text-muted-foreground">Reunión #{r.id}</p>
            <SheetTitle className="text-xl text-vambe-900">{r.cliente}</SheetTitle>
            <SheetDescription>
              {r.email} · {fecha(r.fecha)} · {r.vendedor}
            </SheetDescription>
            <div>
              <EstadoCierre closed={r.closed} />
            </div>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            <div>
              <h3 className="mb-1 text-sm font-semibold">Transcripción</h3>
              <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed">
                {r.transcripcion}
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="mb-2 text-sm font-semibold">Análisis del LLM</h3>
              {r.analisis ? (
                <>
                  <FichaAnalisis analisis={r.analisis} />
                  <p className="mt-3 text-xs text-muted-foreground">
                    {r.modelo} · prompt {r.promptVersion}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {r.estadoAnalisis === "error"
                    ? "El modelo no pudo categorizar esta reunión con la taxonomía actual."
                    : "Pendiente de análisis."}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </ConDatos>
  );
}

export function VistaReuniones() {
  const { query } = useFiltros();
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState<OrdenListado>("fecha_desc");
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [queryAnterior, setQueryAnterior] = useState(query);
  const [texto, setTexto] = useState("");
  const [cliente, setCliente] = useState("");

  // La búsqueda se aplica al dejar de escribir, no en cada tecla.
  useEffect(() => {
    const espera = setTimeout(() => {
      setCliente(texto.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(espera);
  }, [texto]);

  // Al cambiar los filtros se vuelve a la primera página.
  if (query !== queryAnterior) {
    setQueryAnterior(query);
    setPagina(1);
  }

  const consulta = useApi<Paginado<ReunionResumen>>(
    conQuery("/reuniones", query, {
      page: String(pagina),
      pageSize: String(POR_PAGINA),
      orden,
      ...(cliente ? { cliente } : {}),
    }),
  );
  const totalPaginas = Math.max(
    1,
    Math.ceil((consulta.data?.total ?? 0) / POR_PAGINA),
  );

  return (
    <>
      <Encabezado
        titulo="Reuniones"
        descripcion="Todas las reuniones con su categorización. Haz clic en una fila para leer la transcripción y el análisis completo."
      />
      <BarraFiltros />
      <div className="relative mb-4 w-96">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar cliente por nombre o email…"
          aria-label="Buscar cliente"
          className="bg-card pl-8"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>
      <Tarjeta>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {consulta.data ? `${numero(consulta.data.total)} reuniones` : "…"}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Ordenar por
            <Select
              value={orden}
              onValueChange={(v) => {
                setOrden(v as OrdenListado);
                setPagina(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fecha_desc">Más recientes</SelectItem>
                <SelectItem value="fecha_asc">Más antiguas</SelectItem>
                <SelectItem value="volumen_desc">Mayor volumen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <ConDatos consulta={consulta} alto="h-96">
          {(datos) =>
            datos.items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No hay reuniones con estos filtros.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Industria</TableHead>
                    <TableHead>Dolor</TableHead>
                    <TableHead className="text-right">Vol./mes</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.items.map((r) => (
                    <TableRow
                      key={r.id}
                      onClick={() => setSeleccionada(r.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <p className="font-medium">{r.cliente}</p>
                        <p className="max-w-xs truncate text-xs text-muted-foreground">
                          {r.extracto}
                        </p>
                      </TableCell>
                      <TableCell>{fecha(r.fecha)}</TableCell>
                      <TableCell>{r.vendedor}</TableCell>
                      <TableCell>
                        {r.analisis
                          ? etiqueta("industria", r.analisis.industria)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {r.analisis
                          ? etiqueta("dolor_principal", r.analisis.dolor_principal)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numero(r.analisis?.volumen_mensual)}
                      </TableCell>
                      <TableCell>
                        <EstadoCierre closed={r.closed} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </ConDatos>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button
            variant="outline"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            ← Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {pagina} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente →
          </Button>
        </div>
      </Tarjeta>
      <Sheet
        open={seleccionada !== null}
        onOpenChange={(abierto) => !abierto && setSeleccionada(null)}
      >
        {/* Mismo selector que usa shadcn para el ancho, para poder sobrescribirlo. */}
        <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-xl">
          {seleccionada !== null && <DetalleReunion id={seleccionada} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
