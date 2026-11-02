import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Kpi({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{etiqueta}</CardDescription>
        <CardTitle className="text-3xl font-semibold text-vambe-900">
          {valor}
        </CardTitle>
      </CardHeader>
      {detalle && (
        <CardContent className="text-xs text-muted-foreground">
          {detalle}
        </CardContent>
      )}
    </Card>
  );
}
