"use client";

import { useEffect, useMemo, useState } from "react";

function money(n: number) { return `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function pct(n: number)   { return `${Math.round((n || 0) * 100)}%`; }

const STATUS_COLORS: Record<string, string> = {
  booked: "#38BDF8", checked_in: "#22C55E", checked_out: "#6366F1",
  cancelled: "#EF4444", no_show: "#F59E0B",
};
const TYPE_COLORS: Record<string, string> = {
  room: "#6366F1", fb: "#F59E0B", minibar: "#EC4899",
  spa: "#22C55E", laundry: "#38BDF8", other: "#94a3b8",
};
const ROOM_STATUS_COLORS: Record<string, { color: string; icon: string }> = {
  available:   { color: "#22C55E", icon: "✅" },
  occupied:    { color: "#6366F1", icon: "🛏️" },
  dirty:       { color: "#F59E0B", icon: "🧹" },
  cleaning:    { color: "#38BDF8", icon: "🫧" },
  maintenance: { color: "#EF4444", icon: "🔧" },
};

function KpiCard({ title, value, hint, color = "#38BDF8", sub }: { title: string; value: string; hint: string; color?: string; sub?: string }) {
  return (
    <div className="rounded-[22px] p-5 flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="text-xs text-white/40 font-medium">{title}</div>
      <div className="text-2xl font-extrabold leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-sm font-semibold text-white/60">{sub}</div>}
      <div className="text-[10px] text-white/30 mt-0.5">{hint}</div>
    </div>
  );
}

function BarRow({ label, value, max, color, suffix = "" }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60 capitalize">{label}</span>
        <span className="font-semibold" style={{ color }}>{typeof value === "number" ? value.toLocaleString() : value}{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/admin/reports");
    const d = await r.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const statusRows = useMemo(() => Object.entries(data?.byStatus || {})
    .sort((a: any, b: any) => b[1] - a[1]), [data]);

  const chargeRows = useMemo(() => Object.entries(data?.chargesByType || {})
    .sort((a: any, b: any) => b[1] - a[1]), [data]);

  const maxCharge = useMemo(() => Math.max(...chargeRows.map(([, v]) => v as number), 1), [chargeRows]);

  const roomStatusRows = useMemo(() => Object.entries(data?.roomsByStatus || {})
    .sort((a: any, b: any) => b[1] - a[1]), [data]);

  const maxStatus = useMemo(() => Math.max(...statusRows.map(([, v]) => v as number), 1), [statusRows]);

  if (loading || !data) return (
    <div className="flex items-center justify-center h-64 text-white/30">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">📈</div>
        <div>Cargando reportes…</div>
      </div>
    </div>
  );

  const k = data.kpis;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Hotel PMS</div>
            <div className="text-2xl font-bold">Reportes & KPIs</div>
            <div className="text-sm text-white/50 mt-1">Ventas, inventario, ocupación, ingresos/egresos · auto-refresh 3s</div>
          </div>
          <button onClick={load}
            className="px-4 py-2.5 rounded-xl text-sm border border-white/10 bg-white/5 hover:bg-white/8 transition">
            ↺ Actualizar
          </button>
        </div>
      </div>

      {/* KPI Grid principal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Ingresos (pagos)" value={money(k.revenuePaid)} hint="Total pagado en folios" color="#22C55E" />
        <KpiCard title="Egresos (compras)" value={money(k.expensesPurchases)} hint="OC recibidas" color="#EF4444" />
        <KpiCard title="Utilidad bruta" value={money(k.grossProfit)} hint="Ingresos – egresos"
          color={k.grossProfit >= 0 ? "#22C55E" : "#EF4444"} />
        <KpiCard title="Ocupación" value={pct(k.occRate)} hint={`${k.occupiedNow} / ${k.totalRooms} hab`} color="#6366F1" />
      </div>

      {/* KPI Grid secundario: métricas hoteleras */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="ADR" value={money(k.adr)} hint="Tarifa diaria promedio (activos)" color="#38BDF8" />
        <KpiCard title="RevPAR" value={money(k.revpar)} hint="Revenue por hab. disponible" color="#A78BFA" />
        <KpiCard title="Saldo pendiente" value={money(k.balanceTotal)} hint="Cargos no cobrados" color="#F59E0B" />
        <KpiCard title="Valor inventario F&B" value={money(k.inventoryValue)} hint={`${k.lowStockCount} items bajo mínimo`}
          color={k.lowStockCount > 0 ? "#F59E0B" : "#22C55E"} />
      </div>

      {/* 3 bloques de detalle */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Reservas por estado */}
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5">
          <div className="font-semibold mb-1">Reservas por estado</div>
          <div className="text-xs text-white/40 mb-4">Distribución operativa</div>
          <div className="space-y-3">
            {statusRows.map(([st, n]: any) => (
              <BarRow key={st} label={st} value={n} max={maxStatus}
                color={STATUS_COLORS[st] || "#94a3b8"} />
            ))}
            {!statusRows.length && <div className="text-white/30 text-sm">Sin datos.</div>}
          </div>
        </div>

        {/* Consumos por categoría */}
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5">
          <div className="font-semibold mb-1">Consumos por categoría</div>
          <div className="text-xs text-white/40 mb-4">Total cargado en folios (demo)</div>
          <div className="space-y-3">
            {chargeRows.map(([type, val]: any) => (
              <BarRow key={type} label={type} value={val} max={maxCharge}
                color={TYPE_COLORS[type] || "#94a3b8"} suffix=" MXN" />
            ))}
            {!chargeRows.length && <div className="text-white/30 text-sm">Sin cargos.</div>}
          </div>
        </div>

        {/* Estado de habitaciones */}
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5">
          <div className="font-semibold mb-1">Habitaciones por estado</div>
          <div className="text-xs text-white/40 mb-4">Estado operativo housekeeping</div>
          <div className="space-y-2">
            {roomStatusRows.map(([st, n]: any) => {
              const cfg = ROOM_STATUS_COLORS[st] || { color: "#94a3b8", icon: "·" };
              return (
                <div key={st} className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{cfg.icon}</span>
                    <span className="capitalize text-white/70">{st}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${k.totalRooms > 0 ? (n / k.totalRooms) * 100 : 0}%`, background: cfg.color }} />
                    </div>
                    <span className="font-bold text-sm w-5 text-right" style={{ color: cfg.color }}>{n}</span>
                  </div>
                </div>
              );
            })}
            {!roomStatusRows.length && <div className="text-white/30 text-sm">Sin habitaciones.</div>}
          </div>
        </div>
      </div>

      {/* Low stock + Compras recibidas */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5">
          <div className="font-semibold mb-1">⚠️ Low stock · Prioridad compra</div>
          <div className="text-xs text-white/40 mb-3">Items por debajo del mínimo</div>
          <div className="space-y-2">
            {(data.top.lowStock || []).map((i: any) => (
              <div key={i.id} className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                <div>
                  <div className="text-sm font-medium">{i.name}</div>
                  <div className="text-[10px] font-mono text-white/40">{i.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-400">{i.stock} {i.unit}</div>
                  <div className="text-[10px] text-white/30">min {i.minStock}</div>
                </div>
              </div>
            ))}
            {!data.top.lowStock?.length && (
              <div className="py-6 text-center text-emerald-400 text-sm">✓ Todo el inventario OK</div>
            )}
          </div>
        </div>

        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5">
          <div className="font-semibold mb-1">Últimas compras recibidas</div>
          <div className="text-xs text-white/40 mb-3">Egresos registrados</div>
          <div className="space-y-2">
            {(data.top.purchasesReceived || []).map((p: any) => {
              const total = (p.lines || []).reduce((s: number, l: any) => s + l.qty * l.unitCost, 0);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div>
                    <div className="text-sm font-mono font-medium">OC-{p.id.slice(0, 8)}</div>
                    <div className="text-[10px] text-white/40">
                      {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString("es-MX") : "—"} · {(p.lines || []).length} líneas
                    </div>
                  </div>
                  <div className="font-bold text-red-400 text-sm">{money(total)}</div>
                </div>
              );
            })}
            {!data.top.purchasesReceived?.length && (
              <div className="py-6 text-center text-white/30 text-sm">Sin compras recibidas</div>
            )}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-[22px] bg-white/[0.03] border border-white/6 p-5">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Roadmap · Reportes producción</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: "📊", label: "ADR / RevPAR por tipo hab.", hint: "Tarifa promedio segmentada" },
            { icon: "⏱️", label: "Eficiencia housekeeping", hint: "Dirty→Ready tiempo promedio" },
            { icon: "🔁", label: "Rotación de inventario", hint: "Días de stock por item" },
            { icon: "📅", label: "Aging saldos", hint: "Pendientes por antigüedad" },
          ].map(r => (
            <div key={r.label} className="rounded-xl px-3 py-2.5 flex gap-2.5 items-start"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-lg shrink-0">{r.icon}</span>
              <div>
                <div className="text-xs font-medium text-white/60">{r.label}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{r.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
