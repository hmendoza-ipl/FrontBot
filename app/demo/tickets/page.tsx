"use client";

import { useEffect, useState } from "react";
import { getDemoUser } from "@/lib/demoAuth";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Nuevo", color: "#38BDF8", bg: "bg-cyan-500/10 border-cyan-500/20" },
  assigned: { label: "Asignado", color: "#F59E0B", bg: "bg-amber-500/10 border-amber-500/20" },
  in_progress: { label: "En proceso", color: "#6366F1", bg: "bg-indigo-500/10 border-indigo-500/20" },
  resolved: { label: "Resuelto", color: "#22C55E", bg: "bg-emerald-500/10 border-emerald-500/20" },
  closed: { label: "Cerrado", color: "#ffffff40", bg: "bg-white/5 border-white/10" },
};

const priorityIcons: Record<string, string> = {
  low: "🟢", normal: "🔵", high: "🟡", urgent: "🔴",
};

export default function GuestTickets() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const router = useRouter();

  async function load(u: any) {
    const r = await fetch(`/api/demo/tickets?hotelId=${u.hotelId}`);
    const data = await r.json();
    setTickets((data.tickets || []).filter((t: any) => t.guestId === u.id));
  }

  useEffect(() => {
    const u = getDemoUser();
    if (!u) { router.push("/demo-login"); return; }
    setUser(u);
    load(u);
    const t = setInterval(() => load(u), 1500);
    return () => clearInterval(t);
  }, []);

  function timeLeft(dueAt: string) {
    const diff = new Date(dueAt).getTime() - Date.now();
    if (diff <= 0) return "⚠️ Vencido";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}m ${s}s`;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">Mis solicitudes</div>
            <div className="text-sm text-white/50 mt-1">Seguimiento en tiempo real de tus tickets</div>
          </div>
          <div className="text-2xl font-bold text-cyan-400">{tickets.filter((t) => t.status !== "closed").length}</div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-10 text-center">
          <div className="text-4xl mb-3">🎫</div>
          <div className="text-white/60">Sin solicitudes activas.</div>
          <div className="text-sm text-white/40 mt-1">Usa las acciones rápidas en Inicio para crear una.</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => {
            const sc = statusConfig[t.status] || statusConfig.new;
            return (
              <div key={t.id} className="rounded-[22px] bg-white/[0.05] border border-white/8 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{priorityIcons[t.priority]}</span>
                      <div className="font-semibold">{t.title}</div>
                    </div>
                    {t.description && (
                      <div className="text-sm text-white/50">{t.description}</div>
                    )}
                    <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-white/40">
                      <span>🕐 SLA: {timeLeft(t.dueAt)}</span>
                      <span>•</span>
                      <span>{new Date(t.createdAt).toLocaleTimeString("es-MX")}</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full border text-xs font-mono whitespace-nowrap ${sc.bg}`} style={{ color: sc.color }}>
                    {sc.label}
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
