"use client";

import { useEffect, useState } from "react";
import { pedir } from "@/lib/api";

type Estado = "verificando" | "despertando" | "listo" | "caido";

// La API corre en el plan gratuito de Render: tras 15 min sin uso se duerme y
// el primer request tarda ~50 s. Se avisa en vez de mostrar una página vacía.
export function AvisoServidor() {
  const [estado, setEstado] = useState<Estado>("verificando");

  useEffect(() => {
    let activo = true;
    const lento = setTimeout(() => {
      if (activo) setEstado((e) => (e === "verificando" ? "despertando" : e));
    }, 2500);
    pedir("/health")
      .then(() => activo && setEstado("listo"))
      .catch(() => activo && setEstado("caido"))
      .finally(() => clearTimeout(lento));
    return () => {
      activo = false;
      clearTimeout(lento);
    };
  }, []);

  if (estado === "despertando") {
    return (
      <div className="bg-accent px-4 py-2 text-center text-sm text-accent-foreground">
        Despertando el servidor (plan gratuito, ~50 s la primera vez)… los
        datos aparecerán solos.
      </div>
    );
  }
  if (estado === "caido") {
    return (
      <div className="bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        No se pudo conectar con la API. Recarga la página en unos segundos.
      </div>
    );
  }
  return null;
}
