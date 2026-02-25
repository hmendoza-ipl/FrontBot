"use client";

import { useEffect, useMemo, useState } from "react";

const COLUMNS = [
  { key: "dirty",       title: "Dirty",        hint: "Pendiente limpiar", color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
  { key: "cleaning",    title: "Cleaning",     hint: "En proceso",        color: "#38BDF8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.2)" },
  { key: "available",   title: "Ready ✓",      hint: "Lista para ocupar", color: "#22C55E", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
  { key: "maintenance", title: "Maintenance",  hint: "Bloqueada",         color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)" },
  { key: "occupied",    title: "Occupied",     hint: "Huésped activo",    color: "#6366F1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)" },
] as const;

type ColKey = typeof COLUMNS[number]["key"];

// Transiciones permitidas por columna
const TRANSITIONS: Record<ColKey, ColKey[]> = {
  dirty:       ["cleaning", "available", "maintenance"],
  cleaning:    ["available", "dirty", "maintenance"],
  available:   ["dirty", "maintenance"],
  maintenance: ["available", "dirty", "cleaning"],
  occupied:    ["dirty"],
};

const ICONS: Record<ColKey, string> = {
  dirty: "🧹", cleaning: "🫧", available: "✅", maintenance: "🔧", occupied: "🛏️",
};

export default function HousekeepingPage() {
  const [rooms, setRooms]   = useState<any[]>([]);
  const [types, setTypes]   = useState<any[]>([]);
  const [moving, setMoving] = useState("");
  const [lastMoved, setLastMoved] = useState<{ number: string; to: string } | null>(null);

  async function load() {
    const r = await fetch("/api/hotel/rooms");
    const d = await r.json();
    setRooms(d.rooms || []);
    setTypes(d.roomTypes || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // auto-refresh cada 5s
    return () => clearInterval(t);
  }, []);

  function typeName(id: string) {
    return types.find((t: any) => t.id === id)?.name || "—";
  }

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of COLUMNS) map[c.key] = [];
    for (const r of rooms) {
      if (map[r.status]) map[r.status].push(r);
      // status desconocido → dirty
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => String(a.number).localeCompare(String(b.number)));
    }
    return map;
  }, [rooms]);

  async function moveTo(id: string, number: string, status: ColKey) {
    setMoving(id + status);
    await fetch("/api/hotel/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "room", id, patch: { status } }),
    });
    setMoving("");
    setLastMoved({ number, to: status });
    setTimeout(() => setLastMoved(null), 2500);
    load();
  }

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const c of COLUMNS) t[c.key] = grouped[c.key]?.length || 0;
    return t;
  }, [grouped]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Hotel PMS</div>
            <div className="text-2xl font-bold">Housekeeping Board</div>
            <div className="text-sm text-white/50 mt-1">
              Flujo: Dirty → Cleaning → Ready · Auto-refresh 5s
            </div>
          </div>
          <button onClick={load}
            className="px-4 py-2.5 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/8 transition">
            ↺ Actualizar
          </button>
        </div>

        {/* Summary badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {COLUMNS.map(c => (
            <div key={c.key} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
              {ICONS[c.key]} {c.title}: {totals[c.key]}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid lg:grid-cols-5 gap-3">
        {COLUMNS.map(col => (
          <div key={col.key} className="rounded-[22px] overflow-hidden flex flex-col"
            style={{ border: `1px solid ${col.border}`, background: col.bg }}>
            {/* Column header */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${col.border}`, background: "rgba(0,0,0,0.2)" }}>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>{ICONS[col.key]}</span>
                  <span style={{ color: col.color }}>{col.title}</span>
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">{col.hint}</div>
              </div>
              <div className="size-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: col.color + "25", color: col.color }}>
                {totals[col.key]}
              </div>
            </div>

            {/* Cards */}
            <div className="p-2.5 space-y-2 flex-1 min-h-[200px]">
              {(grouped[col.key] || []).map(room => {
                const transitions = TRANSITIONS[col.key as ColKey] || [];
                return (
                  <div key={room.id} className="rounded-2xl p-3.5 transition"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold leading-none">Hab {room.number}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{typeName(room.typeId)}</div>
                        {room.notes && (
                          <div className="text-[10px] text-white/30 mt-1 truncate max-w-[100px]">
                            {room.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-base">{ICONS[col.key as ColKey]}</div>
                    </div>

                    {/* Transition buttons */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {transitions.map(to => {
                        const tc = COLUMNS.find(c => c.key === to)!;
                        return (
                          <button key={to}
                            onClick={() => moveTo(room.id, room.number, to)}
                            disabled={moving === room.id + to}
                            className="px-2 py-1 rounded-lg text-[10px] font-semibold transition disabled:opacity-40"
                            style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color }}>
                            {moving === room.id + to ? "…" : `→ ${tc.title.split(" ")[0]}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!grouped[col.key]?.length && (
                <div className="py-8 text-center text-white/20 text-xs">
                  Sin habitaciones
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toast de movimiento */}
      {lastMoved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl"
          style={{ background: "#22C55E", color: "#000", boxShadow: "0 0 32px rgba(34,197,94,0.4)" }}>
          🏷️ Hab {lastMoved.number} → {lastMoved.to}
        </div>
      )}
    </div>
  );
}
