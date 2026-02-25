"use client";
import { useEffect, useState } from "react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:  { label: "Borrador", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  issued: { label: "Emitida",  color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  void:   { label: "Anulada",  color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

export default function BillingPage() {
  const [invoices, setInvoices]       = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selRes, setSelRes]           = useState("");
  const [creating, setCreating]       = useState(false);

  async function load() {
    const [inv, res] = await Promise.all([
      fetch("/api/billing/invoices").then(r => r.json()),
      fetch("/api/hotel/reservations").then(r => r.json()),
    ]);
    setInvoices(inv.invoices || []);
    setReservations(res.reservations || []);
    if (!selRes && res.reservations?.length) setSelRes(res.reservations[0].id);
  }
  useEffect(() => { load(); }, []);

  async function createInvoice() {
    if (!selRes) return;
    setCreating(true);
    await fetch("/api/billing/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: selRes }),
    });
    await load();
    setCreating(false);
  }

  function resCode(id: string) {
    const r = reservations.find(x => x.id === id);
    return r ? `${r.code} — ${r.guestName || r.guestId}` : id.slice(0, 8);
  }

  const totalIssued = invoices.filter(i => i.status === "issued").reduce((s: number, i: any) => s + i.total, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Facturación</div>
        <div className="text-2xl font-bold">Facturas / Billing</div>
        <div className="text-sm text-white/50 mt-1">Genera comprobantes de pago por reserva.</div>

        {/* Summary */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 bg-black/20 border border-white/6 text-center">
            <div className="text-2xl font-extrabold text-cyan-400">{invoices.length}</div>
            <div className="text-xs text-white/40 mt-0.5">Total</div>
          </div>
          <div className="rounded-2xl p-4 bg-black/20 border border-white/6 text-center">
            <div className="text-2xl font-extrabold text-emerald-400">{invoices.filter(i => i.status === "issued").length}</div>
            <div className="text-xs text-white/40 mt-0.5">Emitidas</div>
          </div>
          <div className="rounded-2xl p-4 bg-black/20 border border-white/6 text-center">
            <div className="text-2xl font-extrabold text-indigo-400">${totalIssued.toLocaleString()}</div>
            <div className="text-xs text-white/40 mt-0.5">Total facturado</div>
          </div>
        </div>
      </div>

      {/* Create invoice */}
      <div className="rounded-[22px] bg-white/[0.04] border border-indigo-500/20 p-5 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-white/40 mb-1.5 block">Generar factura para reserva</label>
          <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
            value={selRes} onChange={e => setSelRes(e.target.value)}>
            {reservations.map(r => (
              <option key={r.id} value={r.id}>{r.code} — {r.guestName || r.guestId} ({r.status})</option>
            ))}
          </select>
        </div>
        <button onClick={createInvoice} disabled={creating || !selRes}
          className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-50 transition">
          {creating ? "Generando…" : "🧾 Generar factura"}
        </button>
      </div>

      {/* Invoices list */}
      <div className="space-y-3">
        {invoices.map(inv => {
          const sc = statusConfig[inv.status] || statusConfig.draft;
          return (
            <div key={inv.id} className="rounded-[22px] border p-5 flex items-center justify-between gap-4 flex-wrap"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: sc.color + "20" }}>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-base">{inv.number}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
                <div className="text-xs text-white/50 mt-1.5 space-y-0.5">
                  <div>📋 {resCode(inv.reservationId)}</div>
                  <div className="font-mono">{new Date(inv.createdAt).toLocaleString("es-MX")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-extrabold" style={{ color: sc.color }}>${inv.total.toFixed(2)}</div>
                <a href={`/api/billing/invoices/${inv.id}`} target="_blank"
                  className="px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6366F1, #A78BFA)", color: "#fff" }}>
                  Ver →
                </a>
              </div>
            </div>
          );
        })}
        {!invoices.length && (
          <div className="py-16 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">🧾</div>
            <div>Sin facturas. Genera la primera arriba.</div>
          </div>
        )}
      </div>
    </div>
  );
}
