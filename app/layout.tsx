import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sofilú AI | ERP & POS Inteligente por Telegram y WhatsApp",
  description: "Controla inventario, ventas y clientes con Inteligencia Artificial directamente desde Telegram y WhatsApp. Sin software complicado ni curvas de aprendizaje.",
  keywords: ["ERP WhatsApp", "POS Telegram", "Control de Inventario IA", "Facturación WhatsApp", "Sofilú AI", "CRM Fidelización QR"],
  openGraph: {
    title: "Sofilú AI - Tu ERP & POS Inteligente en WhatsApp y Telegram",
    description: "Registra ventas por voz o fotos, mantén tu inventario al día y recibe dashboards financieros interactivos en tiempo real.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#050508] text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
