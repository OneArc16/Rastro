import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BarraLateral, BarraMovil } from "@/components/navegacion";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rastro — Inventario de tecnología",
    template: "%s | Rastro",
  },
  description:
    "Inventario de equipos de tecnología y hojas de vida de equipos de cómputo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col md:flex-row">
          <BarraLateral />
          <div className="flex min-w-0 flex-1 flex-col">
            <BarraMovil />
            <main className="flex-1 p-4 md:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
