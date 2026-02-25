"use client";
import { useEffect, useMemo, useState } from "react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  available:   { label: "Disponible",   color: "#22C55E", bg: "rgba(34,197,94,0.1)",   icon: "✅" },
  occupied:    { label: "Ocupada",      color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  icon: "🛏️" },
  dirty:       { label: "Sucia",        color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  icon: "🧹" },
  maintenance: { label: "Mantenimiento",color: "#EF4444", bg: "rgba(239,68,68,0.1)",   icon: "🔧" },
};

export default function RoomsPage() {
  const [rooms, setRooms]   = useState<any[]>([]);
  const [types, setTypes]   = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [saving, setSaving] = useState<string>("");

  async function load() {
    const r = await fetch("/api/hotel/rooms");
    const d = await r.json();
    setRooms(d.rooms || []);
    setTypes(d.roomTypes || []);
  }
  useEffect(() => { load(); }, []);

  const typeName = (id: string) => types.find((t: any) => t.id === id)?.name || id;
  const typeRate = (id: string) => types.find((t: any) => t.id === id)?.baseRate || 0;

  const stats = useMemo(() => ({
    available: rooms.filter(r => r.status === "available").length,
    occupied:  rooms.filter(r => r.status === "occupied").length,
    dirty:     rooms.filter(r => r.status === "dirty").length,
    maintenance: rooms.filter(r => r.status === "maintenance").length,
  }), [rooms]);

  const view = filter === "all" ? rooms : rooms.filter(r => r.status === filter);

  async function setStatus(id: string, status: string) {
    setSaving(id + status);
    await fetch("/api/hotel/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch: { status } }),
    });
    await load();
    setSaving("");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Hotel PMS</div>
        <div className="text-2xl font-bold">Habitaciones</div>
        <div className="text-sm text-white/50 mt-1">Gestiona el estado de cada habitación en tiempo real.</div>

        {/* KPI row */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilter(filter === key ? "all" : key)}
              className="rounded-2xl p-4 text-left transition border"
              style={{
                background: filter === key ? cfg.bg : "rgba(0,0,0,0.2)",
                borderColor: filter === key ? cfg.color + "40" : "rgba(255,255,255,0.06)",
              }}>
              <div className="text-xl mb-1">{cfg.icon}</div>
              <div className="text-2xl font-bold" style={{ color: cfg.color }}>{stats[key as keyof typeof stats]}</div>
              <div className="text-xs text-white/50 mt-0.5">{cfg.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Room grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {view.map((room) => {
          const sc = statusConfig[room.status] || statusConfig.available;
          return (
            <div key={room.id} className="rounded-[22px] border p-5 flex flex-col gap-4"
              style={{ background: sc.bg, borderColor: sc.color + "25" }}>
              {/* Room header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl font-extrabold leading-none">{room.number}</div>
                  <div className="text-sm text-white/60 mt-1">{typeName(room.typeId)} · Piso {room.floor || "—"}</div>
                  <div className="text-xs text-white/40 mt-0.5 font-mono">${typeRate(room.typeId).toLocaleString()}/noche</div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: sc.color + "20", color: sc.color, border: `1px solid ${sc.color}30` }}>
                  {sc.icon} {sc.label}
                </div>
              </div>

              {room.notes && (
                <div className="text-xs px-3 py-2 rounded-xl bg-black/20 text-white/50">📝 {room.notes}</div>
              )}

              {/* Status actions */}
              <div className="grid grid-cols-2 gap-1.5 mt-auto">
                {Object.entries(statusConfig).filter(([k]) => k !== room.status).map(([key, cfg]) => (
                  <button key={key} onClick={() => setStatus(room.id, key)}
                    disabled={saving === room.id + key}
                    className="py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1"
                    style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${cfg.color}25`, color: cfg.color }}>
                    {saving === room.id + key ? "…" : <>{cfg.icon} {cfg.label}</>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
