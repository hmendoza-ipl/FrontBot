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

  const guestNav = [
    { href: "/demo", label: "Inicio", icon: "🏠" },
    { href: "/demo/chat", label: "Chat IA", icon: "💬" },
    { href: "/demo/tickets", label: "Solicitudes", icon: "🎫" },
    { href: "/demo/nearby", label: "Cerca de ti", icon: "📍" },
    { href: "/demo/checkout", label: "Checkout Express", icon: "🚀" },
  ];

  const adminNav = [
    // Concierge IA
    { href: "/admin", label: "Dashboard", icon: "📊", group: "ia" },
    { href: "/admin/conversations", label: "Conversaciones", icon: "💬", group: "ia" },
    { href: "/admin/tickets", label: "Tickets", icon: "🎫", group: "ia" },
    // Hotel PMS
    { href: "/admin/rooms", label: "Habitaciones", icon: "🛏️", group: "pms" },
    { href: "/admin/reservations", label: "Reservas", icon: "📋", group: "pms" },
    { href: "/admin/folio", label: "Folio", icon: "🧾", group: "pms" },
    // F&B
    { href: "/admin/fb/inventory", label: "Inventario", icon: "📦", group: "fb" },
    { href: "/admin/fb/vendors", label: "Proveedores", icon: "🏭", group: "fb" },
    { href: "/admin/fb/purchases", label: "Compras", icon: "🛒", group: "fb" },
    // Billing
    { href: "/admin/billing", label: "Facturación", icon: "💰", group: "billing" },
  ];

  const nav = user?.role === "guest" ? guestNav : adminNav;

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
          <nav className="hidden md:flex items-center gap-1 flex-wrap">
            {user?.role !== "guest" ? (
              <>
                {/* Group: IA */}
                <div className="flex items-center gap-1 rounded-xl px-1 py-1" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.1)" }}>
                  {adminNav.filter(i => i.group === "ia").map((item) => (
                    <Link key={item.href} href={item.href}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        pathname === item.href ? "bg-white/10 border border-white/15" : "text-white/55 hover:text-white hover:bg-white/6"
                      }`}>
                      <span>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                </div>
                {/* Group: PMS */}
                <div className="flex items-center gap-1 rounded-xl px-1 py-1" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
                  {adminNav.filter(i => i.group === "pms").map((item) => (
                    <Link key={item.href} href={item.href}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        pathname === item.href ? "bg-white/10 border border-white/15" : "text-white/55 hover:text-white hover:bg-white/6"
                      }`}>
                      <span>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                </div>
                {/* Group: F&B */}
                <div className="flex items-center gap-1 rounded-xl px-1 py-1" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)" }}>
                  {adminNav.filter(i => i.group === "fb").map((item) => (
                    <Link key={item.href} href={item.href}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        pathname === item.href ? "bg-white/10 border border-white/15" : "text-white/55 hover:text-white hover:bg-white/6"
                      }`}>
                      <span>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                </div>
                {/* Group: Billing */}
                <div className="flex items-center gap-1 rounded-xl px-1 py-1" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
                  {adminNav.filter(i => i.group === "billing").map((item) => (
                    <Link key={item.href} href={item.href}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        pathname === item.href ? "bg-white/10 border border-white/15" : "text-white/55 hover:text-white hover:bg-white/6"
                      }`}>
                      <span>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              nav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                      isActive ? "bg-white/10 border border-white/15" : "text-white/60 hover:text-white hover:bg-white/6"
                    }`}>
                    <span className="text-base">{item.icon}</span>{item.label}
                  </Link>
                );
              })
            )}
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
          {(user?.role === "guest" ? guestNav : adminNav).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 whitespace-nowrap transition ${
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
