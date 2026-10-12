import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { RouteVeil } from "@/components/public/RouteVeil";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RemitosARG | Stock, remitos y presupuestos",
  description: "Controlá tu stock, clientes, productos, remitos y presupuestos en un solo lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}<RouteVeil /><Toaster position="bottom-right" richColors closeButton /></body>
    </html>
  );
}
