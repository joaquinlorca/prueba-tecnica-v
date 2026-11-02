import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function Tarjeta({
  titulo,
  subtitulo,
  children,
  className,
}: {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      {titulo && (
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          {subtitulo && <CardDescription>{subtitulo}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function Esqueleto({ className = "h-64" }: { className?: string }) {
  return <Skeleton className={`w-full rounded-xl ${className}`} />;
}
