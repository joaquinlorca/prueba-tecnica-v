import type { ReactNode } from "react";

export function Encabezado({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: ReactNode;
}) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-vambe-900">{titulo}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        {descripcion}
      </p>
    </header>
  );
}
