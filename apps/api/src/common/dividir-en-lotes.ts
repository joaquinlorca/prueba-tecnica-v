export const dividirEnLotes = <T>(items: T[], tamano: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / tamano) }, (_, i) =>
    items.slice(i * tamano, (i + 1) * tamano),
  );
