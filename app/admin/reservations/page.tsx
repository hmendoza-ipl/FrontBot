"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  booked:       { color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  label: "Reservado" },
  checked_in:   { color: "#22C55E", bg: "rgba(34,197,94,0.1)",   label: "Check-in" },
  checked_out:  { color: "#6366F1", bg: "rgba(99,102,241,0.1)",  label: "Check-out" },
  cancelled:    { color: "#EF4444", bg: "rgba(239,68,68,0.1)",   label: "Cancelado" },
  no_show:      { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "No-Show" },
};

const statusFlow: Record<string, string[]> = {
  booked:      ["checked_in", "cancelled", "no_show"],
  checked_in:  ["checked_out"],
  checked_out: [],
  cancelled:   [],
  no_show:     [],
};

function nights(ci: string, co: string) {
  return Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms]               = useState<any[]>([]);
  const [types, setTypes]               = useState<any[]>([]);
  const [tab, setTab]                   = useState<"list" | "new">("list");
  const [saving, setSaving]             = useState(false);
  const [form, setForm] = useState({
    guestName: "Huésped Demo",
    roomId: "r201",
    status: "booked",
    checkIn:  new Date().toISOString().slice(0, 10),
    checkOut: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    adults: 2, children: 0,
    ratePerNight: 1800,
  });

  async function load() {
    const [a, b] = await Promise.all([
      fetch("/api/hotel/reservations").then(r => r.json()),
      fetch("/api/hotel/rooms").then(r => r.json()),
    ]);
    setReservations(a.reservations || []);
    setRooms(b.rooms || []);
    setTypes(b.roomTypes || []);
  }
  useEffect(() => { load(); }, []);

  function roomLabel(id: string) {
    const room = rooms.find((r: any) => r.id === id);
    if (!room) return id;
    const type = types.find((t: any) => t.id === room.typeId);
    return `${room.number} — ${type?.name || ""} (${room.status})`;
  }

  async function create() {
    setSaving(true);
    await fetch("/api/hotel/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId: "g_new", guestName: form.guestName,
        roomId: form.roomId, status: form.status,
        checkIn:  new Date(form.checkIn).toISOString(),
        checkOut: new Date(form.checkOut).toISOString(),
        adults: form.adults, children: form.children,
        ratePerNight: form.ratePerNight,
      }),
    });
    await load();
    setSaving(false);
    setTab("list");
  }

  async function quickStatus(id: string, status: string) {
    await fetch(`/api/hotel/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: { status } }),
    });
    load();
  }

  const kpis = useMemo(() => ({
    total:      reservations.length,
    booked:     reservations.filter(r => r.status === "booked").length,
    in:         reservations.filter(r => r.status === "checked_in").length,
    out:        reservations.filter(r => r.status === "checked_out").length,
  }), [reservations]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Hotel PMS</div>
            <div className="text-2xl font-bold">Reservas</div>
            <div className="text-sm text-white/50 mt-1">Crear, asignar habitación y gestionar check-in/out.</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("list")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${tab === "list" ? "bg-white/10 border-white/20" : "border-white/8 text-white/50"}`}>
              Lista
            </button>
            <button onClick={() => setTab("new")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === "new" ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white" : "bg-white/8 border border-white/10 text-white/70"}`}>
              + Nueva reserva
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: kpis.total, color: "#94a3b8" },
            { label: "Confirmadas", value: kpis.booked, color: "#38BDF8" },
            { label: "En casa", value: kpis.in, color: "#22C55E" },
            { label: "Check-out", value: kpis.out, color: "#6366F1" },
          ].map(k => (
            <div key={k.label} className="rounded-2xl p-3 bg-black/20 border border-white/6 text-center">
              <div className="text-xl font-extrabold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* New reservation form */}
      {tab === "new" && (
        <div className="rounded-[22px] bg-white/[0.06] border border-cyan-500/20 p-6 space-y-4">
          <div className="text-base font-semibold text-cyan-300">Nueva reserva</div>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { label: "Nombre huésped", key: "guestName", type: "text" },
              { label: "Check-in", key: "checkIn", type: "date" },
              { label: "Check-out", key: "checkOut", type: "date" },
              { label: "Tarifa / noche ($)", key: "ratePerNight", type: "number" },
              { label: "Adultos", key: "adults", type: "number" },
              { label: "Menores", key: "children", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-white/50 mb-1 block">{f.label}</label>
                <input type={f.type}
                  className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-white/50 mb-1 block">Habitación</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={form.roomId}
                onChange={e => setForm(p => ({ ...p, roomId: e.target.value }))}>
                {rooms.map((r: any) => (
                  <option key={r.id} value={r.id}>{roomLabel(r.id)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Estado inicial</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="booked">Reservado</option>
                <option value="checked_in">Check-in directo</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={create} disabled={saving}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:opacity-90 transition disabled:opacity-50">
              {saving ? "Guardando…" : "✓ Crear reserva"}
            </button>
            <button onClick={() => setTab("list")} className="text-sm text-white/40 hover:text-white/60 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Reservations list */}
      <div className="space-y-3">
        {reservations.map((r: any) => {
          const sc = statusConfig[r.status] || statusConfig.booked;
          const n = nights(r.checkIn, r.checkOut);
          const total = n * r.ratePerNight;
          const actions = statusFlow[r.status] || [];
          return (
            <div key={r.id} className="rounded-[22px] border p-5"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: sc.color + "20" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-lg">{r.code}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                      {sc.label}
                    </span>
                    {r.guestName && <span className="text-sm text-white/60">👤 {r.guestName}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/50">
                    <span>🛏️ Hab {rooms.find((x: any) => x.id === r.roomId)?.number || "—"}</span>
                    <span>📅 {new Date(r.checkIn).toLocaleDateString("es-MX")} → {new Date(r.checkOut).toLocaleDateString("es-MX")}</span>
                    <span>🌙 {n} noche{n !== 1 ? "s" : ""}</span>
                    <span>👥 {r.adults}A {r.children > 0 ? `${r.children}N` : ""}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-extrabold" style={{ color: sc.color }}>${total.toLocaleString()}</div>
                  <div className="text-xs text-white/40">${r.ratePerNight}/noche</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {actions.map(s => {
                  const as = statusConfig[s];
                  return (
                    <button key={s} onClick={() => quickStatus(r.id, s)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition"
                      style={{ background: as.bg, color: as.color, border: `1px solid ${as.color}30` }}>
                      {s === "checked_in" ? "→ Check-in" : s === "checked_out" ? "→ Check-out" : s === "cancelled" ? "✕ Cancelar" : "No-Show"}
                    </button>
                  );
                })}
                <Link href={`/admin/folio?res=${r.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #38BDF8, #6366F1)", color: "#000" }}>
                  📋 Folio
                </Link>
              </div>
            </div>
          );
        })}
        {reservations.length === 0 && (
          <div className="py-16 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">📋</div>
            <div>Sin reservas. Crea la primera arriba.</div>
          </div>
        )}
      </div>
    </div>
  );
}
