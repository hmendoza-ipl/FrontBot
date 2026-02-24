"use client";

import Image from "next/image";
import Link from "next/link";
import { clearDemoUser, getDemoUser } from "@/lib/demoAuth";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const roleColors: Record<string, string> = {
  guest: "#38BDF8",
  staff: "#22C55E",
  supervisor: "#F59E0B",
  admin: "#6366F1",
};

export function Shell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setUser(getDemoUser()), []);

  const nav =
    user?.role === "guest"
      ? [
          { href: "/demo", label: "Inicio", icon: "🏠" },
          { href: "/demo/chat", label: "Chat IA", icon: "💬" },
          { href: "/demo/tickets", label: "Solicitudes", icon: "🎫" },
          { href: "/demo/nearby", label: "Cerca de ti", icon: "📍" },
          { href: "/demo/checkout", label: "Checkout Express", icon: "🚀" },
        ]
      : [
          { href: "/admin", label: "Dashboard", icon: "📊" },
          { href: "/admin/conversations", label: "Conversaciones", icon: "💬" },
          { href: "/admin/tickets", label: "Tickets", icon: "🎫" },
        ];

  function logout() {
    clearDemoUser();
    router.push("/demo-login");
  }

  const roleColor = user ? roleColors[user.role] || "#38BDF8" : "#38BDF8";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="Frontbot" width={32} height={32} className="rounded-xl" />
            <div>
              <div className="font-semibold text-sm leading-none">Frontbot</div>
              <div className="text-[10px] font-mono" style={{ color: roleColor }}>
                {user ? `${user.fullName} · ${user.role}` : "Demo"}
              </div>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-white/10 border border-white/15"
                      : "text-white/60 hover:text-white hover:bg-white/6"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/demo-login"
              className="hidden sm:flex px-3 py-2 rounded-xl text-xs bg-white/6 border border-white/10 hover:bg-white/10 transition items-center gap-1"
            >
              🔄 Cambiar rol
            </Link>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl text-xs bg-white text-black font-semibold hover:opacity-90 transition"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-white/8 px-4 py-2 flex gap-1 overflow-x-auto">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 whitespace-nowrap transition ${
                  isActive ? "bg-white/10 border border-white/15" : "text-white/60"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 pb-12">{children}</main>
    </div>
  );
}
