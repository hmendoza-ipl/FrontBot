import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frontbot | Qubica.AI",
  description: "Conserje inteligente + Tickets + Chat en vivo para hoteles",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#070A12] text-white antialiased">
        {/* Premium background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(56,189,248,0.18),transparent_50%),radial-gradient(ellipse_at_80%_10%,rgba(99,102,241,0.22),transparent_45%),radial-gradient(ellipse_at_50%_90%,rgba(34,197,94,0.10),transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>
        {children}
      </body>
    </html>
  );
}
