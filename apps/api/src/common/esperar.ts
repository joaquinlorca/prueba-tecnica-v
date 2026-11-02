export type Esperar = (ms: number) => Promise<void>;

export const esperar: Esperar = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));
