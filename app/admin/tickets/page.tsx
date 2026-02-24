"use client";

import { useEffect, useMemo, useState } from "react";
import { getDemoUser } from "@/lib/demoAuth";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string; next?: string; nextLabel?: string }> = {
  new: { label: "Nuevo", color: "#38BDF8", bg: "bg-cyan-500/10 border-cyan-500/20", next: "assigned", nextLabel: "Asignar →" },
  assigned: { label: "Asignado", color: "#F59E0B", bg: "bg-amber-500/10 border-amber-500/20", next: "in_progress", nextLabel: "Iniciar →" },
  in_progress: { label: "En proceso", color: "#6366F1", bg: "bg-indigo-500/10 border-indigo-500/20", next: "resolved", nextLabel: "Resolver ✓" },
  resolved: { label: "Resuelto", color: "#22C55E", bg: "bg-emerald-500/10 border-emerald-500/20", next: "closed", nextLabel: "Cerrar" },
  closed: { label: "Cerrado", color: "#ffffff30", bg: "bg-white/5 border-white/10" },
};

const priorityBadge: Record<string, string> = {
  low: "🟢 Baja", normal: "🔵 Normal", high: "🟡 Alta", urgent: "🔴 Urgente",
};

const areaColors: Record<string, string> = {
  a_housekeeping: "#38BDF8",
  a_roomservice: "#F59E0B",
  a_maintenance: "#EF4444",
  a_frontdesk: "#6366F1",
  a_concierge: "#22C55E",
  a_security: "#EC4899",
};

export default function AdminTickets() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const router = useRouter();

  async function load(u: any) {
    const [t, a] = await Promise.all([
      fetch(`/api/demo/tickets?hotelId=${u.hotelId}`).then((r) => r.json()),
      fetch(`/api/demo/areas`).then((r) => r.json()),
    ]);
    setTickets(t.tickets || []);
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

  async function advanceStatus(ticketId: string, newStatus: string) {
    await fetch("/api/demo/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status: newStatus }),
    });
    if (user) load(user);
  }

  const view = useMemo(() => {
    return tickets.filter((t) => {
      const matchArea = areaFilter === "all" || t.areaId === areaFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchArea && matchStatus;
    });
  }, [tickets, areaFilter, statusFilter]);

  function areaName(areaId: string) {
    return areas.find((a) => a.id === areaId)?.name || areaId;
  }

  function timeLeft(dueAt: string) {
    const diff = new Date(dueAt).getTime() - Date.now();
    if (diff <= 0) return { text: "⚠️ Vencido", urgent: true };
    const m = Math.floor(diff / 60000);
    return { text: `${m}m restante`, urgent: m < 5 };
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xl font-semibold">Tickets</div>
            <div className="text-sm text-white/50 mt-1">Cola operativa · {tickets.filter(t => t.status !== "closed").length} activos</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="rounded-xl bg-black/30 border border-white/10 p-2.5 text-sm outline-none"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="all">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select
              className="rounded-xl bg-black/30 border border-white/10 p-2.5 text-sm outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              {Object.entries(statusConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {view.length === 0 ? (
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-10 text-center">
          <div className="text-4xl mb-3">🎫</div>
          <div className="text-white/50">Sin tickets para este filtro.</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {view.map((t) => {
            const sc = statusConfig[t.status] || statusConfig.new;
            const sla = timeLeft(t.dueAt);
            return (
              <div key={t.id} className="rounded-[22px] bg-white/[0.05] border border-white/8 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: areaColors[t.areaId] || "#888" }}
                      />
                      <div className="font-semibold truncate">{t.title}</div>
                    </div>
                    {t.description && (
                      <div className="text-sm text-white/50 mt-1">{t.description}</div>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-white/40">
                      <span>{areaName(t.areaId)}</span>
                      <span>·</span>
                      <span>{priorityBadge[t.priority]}</span>
                      <span>·</span>
                      <span className={sla.urgent ? "text-red-400" : ""}>{sla.text}</span>
                      <span>·</span>
                      <span className="font-mono">#{t.id.slice(0, 6)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`px-2.5 py-1 rounded-full border text-xs font-mono ${sc.bg}`} style={{ color: sc.color }}>
                      {sc.label}
                    </div>
                    {sc.next && (
                      <button
                        onClick={() => advanceStatus(t.id, sc.next!)}
                        className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/10 text-xs hover:bg-white/12 transition"
                      >
                        {sc.nextLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
