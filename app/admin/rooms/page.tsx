"use client";

import { useEffect, useMemo, useState } from "react";

// 1. CORRECCIÓN: Agregado "cleaning" al tipo
type Room = {
  id: string;
  number: string;
  typeId: string;
  floor?: string;
  status: "available" | "occupied" | "maintenance" | "dirty" | "cleaning";
  notes?: string;
};

type RoomType = {
  id: string;
  name: string;
  baseRate: number;
  capacity: number;
};

const STATUS_CONFIG = {
  available:   { label: "Disponible",    icon: "✅", color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)" },
  occupied:    { label: "Ocupada",       icon: "🛏️", color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)" },
  dirty:       { label: "Sucia",         icon: "🧹", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  cleaning:    { label: "Limpiando",     icon: "🫧", color: "#38BDF8", bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)" },
  maintenance: { label: "Mantenimiento", icon: "🔧", color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"rooms" | "new-room" | "new-type">("rooms");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [newType, setNewType] = useState({ name: "", baseRate: 1500, capacity: 2 });
  const [newRoom, setNewRoom] = useState<any>({
    number: "",
    typeId: "",
    floor: "",
    status: "available",
    notes: "",
  });

  async function load() {
    const r = await fetch("/api/hotel/rooms");
    const d = await r.json();
    setRooms(d.rooms || []);
    setTypes(d.roomTypes || []);
    if (!newRoom.typeId && d.roomTypes?.[0]?.id)
      setNewRoom((p: any) => ({ ...p, typeId: d.roomTypes[0].id }));
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const view = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rooms;
    return rooms.filter(r => `${r.number} ${r.floor ?? ""} ${r.status}`.toLowerCase().includes(s));
  }, [rooms, q]);

  // 2. CORRECCIÓN: Agregado el conteo para "cleaning" para coincidir con STATUS_CONFIG
  const stats = useMemo(() => ({
    available:   rooms.filter(r => r.status === "available").length,
    occupied:    rooms.filter(r => r.status === "occupied").length,
    dirty:       rooms.filter(r => r.status === "dirty").length,
    cleaning:    rooms.filter(r => r.status === "cleaning").length,
    maintenance: rooms.filter(r => r.status === "maintenance").length,
  }), [rooms]);

  function typeName(id: string) {
    return types.find(t => t.id === id)?.name || "—";
  }
  function typeRate(id: string) {
    return types.find(t => t.id === id)?.baseRate || 0;
  }

  async function createRoomType() {
    if (!newType.name.trim()) return showToast("Nombre requerido", false);
    setSaving(true);
    const r = await fetch("/api/hotel/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "roomType", data: { ...newType, baseRate: Number(newType.baseRate), capacity: Number(newType.capacity) } }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) return showToast(d?.error || "Error", false);
    await load();
    setNewType({ name: "", baseRate: 1500, capacity: 2 });
    setTab("rooms");
    showToast(`✅ Tipo "${d.roomType.name}" creado`);
  }

  async function createRoom() {
    if (!newRoom.number.trim()) return showToast("Número requerido", false);
    if (!newRoom.typeId) return showToast("Selecciona un tipo", false);
    setSaving(true);
    const r = await fetch("/api/hotel/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "room", data: newRoom }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) return showToast(d?.error || "Error", false);
    await load();
    setNewRoom((p: any) => ({ ...p, number: "", floor: "", notes: "" }));
    setTab("rooms");
    showToast(`✅ Hab ${d.room.number} creada`);
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/hotel/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "room", id, patch: { status } }),
    });
    load();
  }

  async function removeRoom(id: string, number: string) {
    if (!confirm(`¿Eliminar habitación ${number}?`)) return;
    const r = await fetch(`/api/hotel/rooms?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) return showToast(d?.error || "Error", false);
    load();
    showToast(`🗑️ Hab ${number} eliminada`);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Hotel PMS</div>
            <div className="text-2xl font-bold">Habitaciones</div>
            <div className="text-sm text-white/50 mt-1">Inventario de habitaciones, tipos y estado operativo.</div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="w-56 rounded-xl bg-black/30 border border-white/10 p-2.5 outline-none text-sm"
              placeholder="🔍 Buscar…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button onClick={() => setTab(tab === "new-type" ? "rooms" : "new-type")}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition border ${tab === "new-type" ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-white/6 border-white/10 text-white/70"}`}>
              + Tipo
            </button>
            <button onClick={() => setTab(tab === "new-room" ? "rooms" : "new-room")}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${tab === "new-room" ? "bg-cyan-500 text-black" : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"}`}>
              + Habitación
            </button>
          </div>
        </div>

        {/* KPI badges */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, sc]) => (
            <div key={key} className="rounded-2xl p-3.5 text-center"
              style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
              {/* Ahora stats[key] es seguro porque key incluye 'cleaning' y stats también */}
              <div className="text-2xl font-extrabold" style={{ color: sc.color }}>{stats[key]}</div>
              <div className="text-[11px] text-white/50 mt-0.5">{sc.icon} {sc.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form: nuevo tipo */}
      {tab === "new-type" && (
        <div className="rounded-[22px] border p-5 space-y-3"
          style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.2)" }}>
          <div className="text-sm font-semibold text-indigo-300">Nuevo tipo de habitación</div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Nombre *</label>
              <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newType.name}
                onChange={e => setNewType(p => ({ ...p, name: e.target.value }))}
                placeholder="Standard, Deluxe, Suite…" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Tarifa base / noche</label>
              <input type="number" className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newType.baseRate}
                onChange={e => setNewType(p => ({ ...p, baseRate: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Capacidad (personas)</label>
              <input type="number" className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newType.capacity}
                onChange={e => setNewType(p => ({ ...p, capacity: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createRoomType} disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition disabled:opacity-40">
              {saving ? "Guardando…" : "✓ Crear tipo"}
            </button>
            <button onClick={() => setTab("rooms")} className="px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white/60 transition">
              Cancelar
            </button>
          </div>

          {/* Tipos existentes */}
          {types.length > 0 && (
            <div className="pt-3 border-t border-white/8">
              <div className="text-xs text-white/30 mb-2">Tipos actuales</div>
              <div className="flex flex-wrap gap-2">
                {types.map(t => (
                  <span key={t.id} className="px-3 py-1.5 rounded-xl text-xs border"
                    style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.2)", color: "#A5B4FC" }}>
                    {t.name} · ${t.baseRate}/n · {t.capacity}p
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form: nueva habitación */}
      {tab === "new-room" && (
        <div className="rounded-[22px] border p-5 space-y-3"
          style={{ background: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.2)" }}>
          <div className="text-sm font-semibold text-cyan-300">Nueva habitación</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Número *</label>
              <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newRoom.number}
                onChange={e => setNewRoom((p: any) => ({ ...p, number: e.target.value }))}
                placeholder="101, 202, VIP…" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Piso</label>
              <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newRoom.floor}
                onChange={e => setNewRoom((p: any) => ({ ...p, floor: e.target.value }))}
                placeholder="1, 2, PB…" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Tipo *</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newRoom.typeId}
                onChange={e => setNewRoom((p: any) => ({ ...p, typeId: e.target.value }))}>
                <option value="">Selecciona…</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name} · ${t.baseRate}/n · {t.capacity}p</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Estado inicial</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newRoom.status}
                onChange={e => setNewRoom((p: any) => ({ ...p, status: e.target.value }))}>
                {Object.entries(STATUS_CONFIG).map(([k, sc]) => (
                  <option key={k} value={k}>{sc.icon} {sc.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-white/40 mb-1.5 block">Notas (opcional)</label>
              <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={newRoom.notes}
                onChange={e => setNewRoom((p: any) => ({ ...p, notes: e.target.value }))}
                placeholder="Vista al mar, balcón, accesible…" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createRoom} disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition disabled:opacity-40">
              {saving ? "Guardando…" : "✓ Crear habitación"}
            </button>
            <button onClick={() => setTab("rooms")} className="px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white/60 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de habitaciones */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {view.map(room => {
          const sc = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;
          return (
            <div key={room.id} className="rounded-[22px] border p-5 flex flex-col gap-3"
              style={{ background: sc.bg, borderColor: sc.border }}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl font-extrabold leading-none">{room.number}</div>
                  <div className="text-sm text-white/60 mt-1">{typeName(room.typeId)}</div>
                  <div className="text-xs text-white/40 font-mono">${typeRate(room.typeId).toLocaleString()}/n · Piso {room.floor || "—"}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(0,0,0,0.25)", color: sc.color, border: `1px solid ${sc.border}` }}>
                  {sc.icon} {sc.label}
                </span>
              </div>

              {room.notes && (
                <div className="text-xs px-3 py-2 rounded-xl text-white/50"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  📝 {room.notes}
                </div>
              )}

              {/* Status buttons */}
              <div className="grid grid-cols-2 gap-1.5 mt-auto">
                {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][])
                  .filter(([k]) => k !== room.status)
                  .map(([key, cfg]) => (
                    <button key={key} onClick={() => setStatus(room.id, key)}
                      className="py-2 rounded-xl text-[11px] font-semibold transition"
                      style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${cfg.color}25`, color: cfg.color }}>
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                <button onClick={() => removeRoom(room.id, room.number)}
                  className="col-span-2 py-2 rounded-xl text-[11px] font-semibold transition"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          );
        })}
        {!view.length && (
          <div className="col-span-3 py-16 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">🛏️</div>
            <div>No hay habitaciones{q ? ` para "${q}"` : ""}.</div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl"
          style={{
            background: toast.ok ? "#22C55E" : "#EF4444",
            color: "#000",
            boxShadow: `0 0 32px ${toast.ok ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}