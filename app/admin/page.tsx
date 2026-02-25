"use client";

import { useEffect, useMemo, useState } from "react";
import { getDemoUser } from "@/lib/demoAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

const areaColors: Record<string, string> = {
  a_housekeeping: "#38BDF8",
  a_roomservice: "#F59E0B",
  a_maintenance: "#EF4444",
  a_frontdesk: "#6366F1",
  a_concierge: "#22C55E",
  a_security: "#EC4899",
};

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [convs, setConvs] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const router = useRouter();

  async function load(u: any) {
    const [t, c, a] = await Promise.all([
      fetch(`/api/demo/tickets?hotelId=${u.hotelId}`).then((r) => r.json()),
      fetch(`/api/demo/conversations?hotelId=${u.hotelId}`).then((r) => r.json()),
      fetch(`/api/demo/areas`).then((r) => r.json()),
    ]);
    setTickets(t.tickets || []);
    setConvs(c.conversations || []);
    setAreas(a.areas || []);
  }

  useEffect(() => {
    const u = getDemoUser();
    if (!u) { router.push("/demo-login"); return; }
    setUser(u);
    load(u);
    const it = setInterval(() => load(u), 1500);
    return () => clearInterval(it);
  }, []);

  const kpis = useMemo(() => {
    const open = tickets.filter((x) => x.status !== "closed" && x.status !== "resolved").length;
    const urgent = tickets.filter((x) => x.priority === "urgent").length;
    const resolved = tickets.filter((x) => x.status === "resolved").length;
    const activeConvs = convs.length;
    const takeovers = convs.filter((c) => c.humanTakeover).length;
    return { open, urgent, resolved, activeConvs, takeovers };
  }, [tickets, convs]);

  const byArea = useMemo(() => {
    return areas.map((a) => ({
      ...a,
      count: tickets.filter((t) => t.areaId === a.id && t.status !== "closed").length,
    })).filter((a) => a.count > 0);
  }, [areas, tickets]);

  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/50 font-mono uppercase tracking-wider">Panel Admin</div>
            <div className="text-2xl font-bold mt-1">Dashboard Operativo</div>
            <div className="text-sm text-white/50 mt-1">
              {user?.fullName} · {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/conversations" className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition">
              💬 Conversaciones
            </Link>
            <Link href="/admin/tickets" className="px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-sm hover:bg-white/12 transition">
              🎫 Tickets
            </Link>
            <Link href="/admin/reservations" className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-sm text-indigo-300 hover:bg-indigo-500/20 transition">
              📋 Reservas
            </Link>
            <Link href="/admin/rooms" className="px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-sm hover:bg-white/12 transition">
              🛏️ Habitaciones
            </Link>
            <Link href="/admin/fb/inventory" className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300 hover:bg-amber-500/15 transition">
              📦 F&B
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Tickets abiertos", value: kpis.open, color: "#38BDF8", icon: "🎫" },
          { label: "Urgentes", value: kpis.urgent, color: "#EF4444", icon: "🔴" },
          { label: "Resueltos", value: kpis.resolved, color: "#22C55E", icon: "✅" },
          { label: "Conversaciones", value: kpis.activeConvs, color: "#6366F1", icon: "💬" },
          { label: "Intervenciones", value: kpis.takeovers, color: "#F59E0B", icon: "⚡" },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-[20px] bg-white/[0.05] border border-white/8 p-4"
            style={{ borderColor: `${k.color}25` }}
          >
            <div className="text-xl mb-1">{k.icon}</div>
            <div className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-white/50 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By area */}
        <div className="rounded-[22px] bg-white/[0.05] border border-white/8 p-5">
          <div className="font-semibold mb-4">Carga por área</div>
          {byArea.length === 0 ? (
            <div className="text-white/40 text-sm py-4 text-center">Sin tickets activos</div>
          ) : (
            <div className="space-y-3">
              {byArea.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: areaColors[a.id] || "#888" }}
                  />
                  <div className="flex-1 text-sm">{a.name}</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full min-w-[20px]"
                      style={{
                        width: `${Math.min(a.count * 20, 120)}px`,
                        backgroundColor: `${areaColors[a.id] || "#888"}60`,
                      }}
                    />
                    <div className="text-xs font-mono text-white/60 w-4">{a.count}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent tickets */}
        <div className="rounded-[22px] bg-white/[0.05] border border-white/8 p-5">
          <div className="font-semibold mb-4">Tickets recientes</div>
          {recentTickets.length === 0 ? (
            <div className="text-white/40 text-sm py-4 text-center">Sin tickets aún</div>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: areaColors[t.areaId] || "#888" }}
                  />
                  <div className="flex-1 text-sm truncate">{t.title}</div>
                  <div className="text-xs text-white/40 font-mono shrink-0">{t.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
