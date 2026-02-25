"use client";

import { useEffect, useMemo, useState } from "react";

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

const TODAY = fmtDate(new Date());

export default function AvailabilityPage() {
  const [rooms, setRooms]         = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [days, setDays]           = useState(14);
  const [filterType, setFilterType] = useState("all");

  async function load() {
    const [a, b] = await Promise.all([
      fetch("/api/hotel/rooms").then(r => r.json()),
      fetch("/api/hotel/reservations").then(r => r.json()),
    ]);
    setRooms(a.rooms || []);
    setRoomTypes(a.roomTypes || []);
    setReservations(b.reservations || []);
  }

  useEffect(() => { load(); }, []);

  const dates = useMemo(() => {
    const start = new Date();
    return Array.from({ length: days }, (_, i) => fmtDate(addDays(start, i)));
  }, [days]);

  function typeName(typeId: string) {
    return roomTypes.find((t: any) => t.id === typeId)?.name || "—";
  }

  const viewRooms = useMemo(() =>
    filterType === "all" ? rooms : rooms.filter(r => r.typeId === filterType),
    [rooms, filterType]
  );

  function cellInfo(roomId: string, day: string) {
    const dayStart = `${day}T00:00:00.000Z`;
    const dayEnd   = `${day}T23:59:59.999Z`;
    const active = reservations.filter((r: any) =>
      r.roomId === roomId && ["booked", "checked_in"].includes(r.status)
    );
    const hit = active.find((r: any) => overlaps(dayStart, dayEnd, r.checkIn, r.checkOut));
    if (hit) return { kind: hit.status === "checked_in" ? "in" : "booked", code: hit.code, guestName: hit.guestName };
    return { kind: "free" };
  }

  // Totales por día (para el summary row)
  function dayOccupancy(day: string) {
    return rooms.filter(room => cellInfo(room.id, day).kind !== "free").length;
  }

  const cellStyle = {
    free:   { bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)",  color: "#22C55E", label: "" },
    booked: { bg: "rgba(56,189,248,0.15)", border: "rgba(56,189,248,0.3)", color: "#38BDF8", label: "RES" },
    in:     { bg: "rgba(99,102,241,0.2)",  border: "rgba(99,102,241,0.35)",color: "#A5B4FC", label: "IN" },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Hotel PMS</div>
            <div className="text-2xl font-bold">Disponibilidad</div>
            <div className="text-sm text-white/50 mt-1">Calendario por habitación · próximos días.</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm outline-none"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              {roomTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select
              className="rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm outline-none"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={21}>21 días</option>
              <option value={30}>30 días</option>
            </select>
            <button onClick={load}
              className="px-3.5 py-2.5 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/8 transition">
              ↺ Actualizar
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 flex-wrap">
          {Object.entries(cellStyle).filter(([k]) => k !== "free").concat([["free", cellStyle.free]]).map(([k, st]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <div className="size-4 rounded" style={{ background: st.bg, border: `1px solid ${st.border}` }} />
              <span className="text-white/50">{k === "free" ? "Libre" : k === "booked" ? "Reservado" : "Check-in"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar table */}
      <div className="rounded-[22px] bg-white/[0.04] border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                <th className="text-left px-4 py-3 sticky left-0 z-10 font-medium text-white/70 min-w-[160px]"
                  style={{ background: "rgba(0,0,0,0.4)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  Habitación
                </th>
                {dates.map(d => {
                  const isToday = d === TODAY;
                  const occ = dayOccupancy(d);
                  const pct = viewRooms.length ? Math.round(occ / viewRooms.length * 100) : 0;
                  return (
                    <th key={d} className="px-2 py-2 text-center min-w-[56px]"
                      style={{ borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="text-[10px] font-bold" style={{ color: isToday ? "#38BDF8" : "rgba(255,255,255,0.5)" }}>
                        {d.slice(5)}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: pct > 75 ? "#EF4444" : pct > 40 ? "#F59E0B" : "#22C55E" }}>
                        {pct}%
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {viewRooms.map((room, idx) => (
                <tr key={room.id}
                  style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td className="px-4 py-2 sticky left-0 z-10"
                    style={{ background: idx % 2 === 0 ? "rgba(10,10,20,0.6)" : "rgba(10,10,20,0.4)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="font-semibold text-sm leading-none">Hab {room.number}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{typeName(room.typeId)}</div>
                  </td>
                  {dates.map(d => {
                    const cell = cellInfo(room.id, d);
                    const st = cellStyle[cell.kind as keyof typeof cellStyle] || cellStyle.free;
                    const isToday = d === TODAY;
                    return (
                      <td key={d} className="px-1.5 py-1.5"
                        style={{ borderLeft: isToday ? "2px solid rgba(56,189,248,0.3)" : "1px solid rgba(255,255,255,0.03)" }}>
                        <div className="h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition cursor-default"
                          style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
                          title={cell.code ? `${cell.code}${cell.guestName ? " · " + cell.guestName : ""}` : undefined}>
                          {cell.kind === "free"
                            ? <span style={{ opacity: 0.25 }}>·</span>
                            : <span>{st.label}</span>
                          }
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!viewRooms.length && (
                <tr>
                  <td className="px-6 py-10 text-white/30 text-center" colSpan={dates.length + 1}>
                    Sin habitaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 flex gap-6 flex-wrap text-xs text-white/40 border-t border-white/6"
          style={{ background: "rgba(0,0,0,0.2)" }}>
          <span>RES = reservado · IN = check-in activo</span>
          <span>% = ocupación del día sobre {viewRooms.length} hab{viewRooms.length !== 1 ? "s" : ""}</span>
          <span>Hover sobre celda para ver código y huésped</span>
        </div>
      </div>
    </div>
  );
}
