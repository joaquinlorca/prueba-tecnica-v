import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AvisoServidor } from "@/components/layout/aviso-servidor";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vambe Insights",
    template: "%s · Vambe Insights",
  },
  description:
    "Reuniones de venta categorizadas con IA: qué leads cierran, cómo rinde cada vendedor y qué pide el mercado.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <TooltipProvider>
          <Navbar />
          <AvisoServidor />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
            {children}
          </main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
