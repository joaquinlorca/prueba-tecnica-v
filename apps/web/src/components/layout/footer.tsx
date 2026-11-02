import { API_URL } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-auto bg-vambe-950 text-sm text-vambe-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-5">
        <p>
          <span className="font-semibold text-white">Vambe Insights</span> · reuniones categorizadas con Gemma 4
        </p>
        <p className="flex gap-4">
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            Documentación de la API
          </a>
        </p>
      </div>
    </footer>
  );
}
