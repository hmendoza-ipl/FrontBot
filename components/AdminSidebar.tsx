"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearDemoUser, getDemoUser } from "@/lib/demoAuth";
import { useRouter } from "next/navigation";

type NavSection = {
  label: string;
  color: string;
  items: { href: string; icon: string; label: string; hint?: string }[];
};

const NAV: NavSection[] = [
  {
    label: "Concierge IA",
    color: "#38BDF8",
    items: [
      { href: "/admin",               icon: "📊", label: "Dashboard",     hint: "KPIs generales" },
      { href: "/admin/conversations", icon: "💬", label: "Conversaciones", hint: "Live takeover" },
      { href: "/admin/tickets",       icon: "🎫", label: "Tickets",        hint: "SLA por área" },
    ],
  },
  {
    label: "Hotel PMS",
    color: "#6366F1",
    items: [
      { href: "/admin/rooms",        icon: "🛏️", label: "Habitaciones",   hint: "Estado + CRUD" },
      { href: "/admin/reservations", icon: "📋", label: "Reservas",       hint: "Check-in / out" },
      { href: "/admin/folio",        icon: "🧾", label: "Folio",          hint: "Consumos / pagos" },
      { href: "/admin/availability", icon: "📅", label: "Disponibilidad", hint: "Calendario" },
      { href: "/admin/housekeeping", icon: "🧹", label: "Housekeeping",   hint: "Board dirty→ready" },
      { href: "/admin/reports",      icon: "📈", label: "Reportes",       hint: "Ventas & KPIs" },
    ],
  },
  {
    label: "F&B",
    color: "#F59E0B",
    items: [
      { href: "/admin/fb/inventory", icon: "📦", label: "Inventario",  hint: "Stock + movimientos" },
      { href: "/admin/fb/vendors",   icon: "🏭", label: "Proveedores", hint: "Directorio" },
      { href: "/admin/fb/purchases", icon: "🛒", label: "Compras",     hint: "OC + recepción" },
    ],
  },
  {
    label: "Facturación",
    color: "#22C55E",
    items: [
      { href: "/admin/billing", icon: "💰", label: "Billing", hint: "Invoices demo" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getDemoUser());
    try {
      const raw = localStorage.getItem("frontbot_admin_sidebar_collapsed");
      if (raw) setCollapsed(raw === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("frontbot_admin_sidebar_collapsed", collapsed ? "1" : "0"); }
    catch {}
  }, [collapsed]);

  function logout() {
    clearDemoUser();
    router.push("/demo-login");
  }

  return (
    <aside
      className="h-screen sticky top-0 flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-2xl shrink-0 overflow-y-auto"
      style={{ width: collapsed ? 72 : 260, transition: "width 0.2s ease" }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-white/8">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/logo.png" alt="Frontbot" width={36} height={36} className="rounded-xl shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sm leading-none truncate">Frontbot</div>
              <div className="text-[10px] text-white/50 mt-0.5 truncate">Hotel Ops · Admin</div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="shrink-0 size-7 rounded-lg flex items-center justify-center text-xs font-bold transition"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
        {NAV.map(section => (
          <div key={section.label}>
            {/* Section label */}
            {!collapsed && (
              <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest truncate"
                style={{ color: section.color + "99" }}>
                {section.label}
              </div>
            )}
            {collapsed && (
              <div className="my-1 mx-2 h-px" style={{ background: section.color + "30" }} />
            )}

            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    title={collapsed ? item.label : undefined}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition group"
                    style={{
                      background: active ? section.color + "18" : "transparent",
                      border: `1px solid ${active ? section.color + "30" : "transparent"}`,
                    }}
                  >
                    {/* Icon bubble */}
                    <span className="size-8 shrink-0 rounded-xl flex items-center justify-center text-base transition"
                      style={{
                        background: active ? section.color + "25" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${active ? section.color + "40" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate leading-none"
                          style={{ color: active ? "#fff" : "rgba(255,255,255,0.7)" }}>
                          {item.label}
                        </div>
                        {item.hint && (
                          <div className="text-[10px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {item.hint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active indicator */}
                    {active && !collapsed && (
                      <div className="size-1.5 rounded-full shrink-0" style={{ background: section.color }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: user + logout */}
      <div className="p-3 border-t border-white/8">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl flex items-center justify-center text-sm shrink-0"
              style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
              {user?.fullName?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user?.fullName || "Admin"}</div>
              <div className="text-[10px] text-white/40 truncate capitalize">{user?.role || "admin"}</div>
            </div>
            <button onClick={logout}
              className="text-[10px] px-2 py-1.5 rounded-lg transition hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              Salir
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Salir"
            className="w-full h-8 rounded-xl flex items-center justify-center text-sm transition hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            ↩
          </button>
        )}
      </div>
    </aside>
  );
}
