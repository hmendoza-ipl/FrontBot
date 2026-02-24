"use client";

import { getDemoUser } from "@/lib/demoAuth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const quickActions = [
  { title: "Toallas extra", areaId: "a_housekeeping", icon: "🛁", color: "#38BDF8", sla: "20 min" },
  { title: "Room service", areaId: "a_roomservice", icon: "🍽️", color: "#F59E0B", sla: "30 min" },
  { title: "Mantenimiento", areaId: "a_maintenance", icon: "🔧", color: "#EF4444", sla: "45 min" },
  { title: "Late checkout", areaId: "a_frontdesk", icon: "🕐", color: "#6366F1", sla: "15 min" },
  { title: "Taxi / Tour", areaId: "a_concierge", icon: "🚕", color: "#22C55E", sla: "60 min" },
  { title: "Queja de ruido", areaId: "a_security", icon: "🔔", color: "#EC4899", sla: "10 min" },
];

export default function GuestHome() {
  const [user, setUser] = useState<any>(null);
  const [creating, setCreating] = useState<string>("");
  const [created, setCreated] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const u = getDemoUser();
    if (!u) { router.push("/demo-login"); return; }
    setUser(u);
  }, []);

  async function createQuick(q: typeof quickActions[0]) {
    if (!user) return;
    setCreating(q.areaId);
    await fetch("/api/demo/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: user.hotelId,
        guestId: user.id,
        areaId: q.areaId,
        title: q.title,
        description: `Solicitud de: ${q.title}`,
        priority: "normal",
      }),
    });
    setCreating("");
    setCreated((prev) => [...prev, q.areaId]);
    setTimeout(() => setCreated((prev) => prev.filter((x) => x !== q.areaId)), 3000);
  }

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="size-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-white/50 text-sm">Bienvenido de vuelta</div>
            <div className="text-3xl font-bold mt-1">{user.fullName}</div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-sm">
                🏨 Habitación {user.roomNumber}
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono">
                ✓ Check-in activo
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40 font-mono">Hotel Demo</div>
            <div className="text-xs text-white/30 font-mono mt-0.5">Qubica.AI</div>
          </div>
        </div>

        <div className="mt-5 flex gap-3 flex-wrap">
          <Link
            href="/demo/chat"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition flex items-center gap-2"
          >
            💬 Abrir chat con IA
          </Link>
          <Link
            href="/demo/tickets"
            className="px-5 py-2.5 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 transition text-sm font-medium"
          >
            🎫 Ver mis solicitudes
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">Acciones rápidas</div>
          <div className="text-xs text-white/40">Crea un ticket al instante</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((q) => {
            const isCreating = creating === q.areaId;
            const isDone = created.includes(q.areaId);
            return (
              <button
                key={q.areaId}
                onClick={() => createQuick(q)}
                disabled={isCreating}
                className="text-left rounded-[22px] bg-white/[0.05] border border-white/8 backdrop-blur-xl p-5 hover:bg-white/8 hover:border-white/15 transition-all group"
                style={{ borderColor: isDone ? `${q.color}40` : "" }}
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl mb-3">{isDone ? "✅" : q.icon}</div>
                  <div
                    className="text-xs font-mono px-2 py-0.5 rounded-full opacity-60"
                    style={{ backgroundColor: `${q.color}15`, color: q.color }}
                  >
                    ~{q.sla}
                  </div>
                </div>
                <div className="font-semibold">{q.title}</div>
                <div className="text-xs text-white/40 mt-1">
                  {isDone ? "¡Ticket creado!" : isCreating ? "Creando…" : "Toca para solicitar →"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info strip */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: "📶", title: "WiFi", value: "FrontbotGuest · frontbot2024" },
          { icon: "🍳", title: "Desayuno", value: "7:00 - 11:00 · Salón Jardín" },
          { icon: "🏊", title: "Piscina", value: "8:00 - 20:00 · Planta Baja" },
        ].map((info) => (
          <div key={info.title} className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
            <div className="text-xl mb-1">{info.icon}</div>
            <div className="text-xs text-white/50">{info.title}</div>
            <div className="text-sm font-medium mt-0.5">{info.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
