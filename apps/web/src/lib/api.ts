import useSWR, { type SWRConfiguration } from "swr";
import { API_URL } from "./config";

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// Nest responde { message: string | string[] } en los errores.
const mensajeDeError = (cuerpo: unknown): string | undefined => {
  const mensaje = (cuerpo as { message?: unknown } | null)?.message;
  if (Array.isArray(mensaje)) return mensaje.join(". ");
  return typeof mensaje === "string" ? mensaje : undefined;
};

export const pedir = async <T>(ruta: string, init?: RequestInit): Promise<T> => {
  const respuesta = await fetch(`${API_URL}${ruta}`, init);
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(
      mensajeDeError(cuerpo) ?? `Error ${respuesta.status}`,
      respuesta.status,
    );
  }
  return cuerpo as T;
};

// Los datos se piden desde el navegador: la API (Render, plan gratuito) puede
// tardar ~50 s en despertar y un fetch en el servidor de Vercel cortaría antes.
export const useApi = <T>(ruta: string | null, opciones?: SWRConfiguration<T>) =>
  useSWR<T>(ruta, pedir, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    ...opciones,
  });
