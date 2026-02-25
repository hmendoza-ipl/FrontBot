"use client";

import { useEffect, useState } from "react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:  { label: "Borrador", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.15)" },
  issued: { label: "Emitida",  color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)" },
  void:   { label: "Anulada",  color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)" },
};

export default function BillingPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [reservationId, setReservationId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  async function load() {
    const [r, i] = await Promise.all([
      fetch("/api/hotel/reservations").then((x) => x.json()),
      fetch("/api/billing/invoices").then((x) => x.json()),
    ]);
    setReservations(r.reservations || []);
    setInvoices(i.invoices || []);
    if (!reservationId && r.reservations?.[0]?.id)
      setReservationId(r.reservations[0].id);
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function generate() {
    if (!reservationId) return showToast("Selecciona una reserva", false);
    setGenerating(true);
    const r = await fetch("/api/billing/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });
    const d = await r.json();
    setGenerating(false);
    if (!r.ok) return showToast(d?.error || "Error al generar", false);
    showToast(`🧾 Factura ${d.invoice.number} generada`);
    await load();
  }

  function resLabel(id: string) {
    const r = reservations.find(x => x.id === id);
    if (!r) return id.slice(0, 8);
    return `${r.code} · ${r.guestName || r.guestId} · ${r.status}`;
  }

  const totalIssued = invoices
    .filter(i => i.status === "issued")
    .reduce((s: number, i: any) => s + Number(i.total || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Facturación</div>
            <div className="text-2xl font-bold">Billing · Facturas</div>
            <div className="text-sm text-white/50 mt-1">Genera invoice desde el folio de una reserva.</div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Total", value: invoices.length, color: "#94a3b8" },
              { label: "Emitidas", value: invoices.filter(i => i.status === "issued").length, color: "#22C55E" },
              { label: "Facturado", value: `$${totalIssued.toLocaleString()}`, color: "#6366F1" },
            ].map(k => (
              <div key={k.label} className="rounded-2xl px-4 py-3 bg-black/20 border border-white/6">
                <div className="text-lg font-extrabold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generar factura */}
      <div className="rounded-[22px] bg-white/[0.05] border border-white/10 p-5">
        <div className="text-sm font-semibold text-indigo-300 mb-4">Generar factura desde reserva</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="text-xs text-white/50 mb-1.5">Reserva</div>
            <select
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {reservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} · Room {r.roomId || "—"} · {r.status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generate}
              disabled={generating || !reservationId}
              className="w-full px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {generating ? "Generando…" : "🧾 Generar factura"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista facturas */}
      <div className="space-y-3">
        {invoices.map((inv) => {
          const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
          return (
            <div key={inv.id} className="rounded-[22px] border p-5"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: sc.border }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-base">{inv.number}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="text-sm text-white/50 mt-1">
                    📋 {resLabel(inv.reservationId)}
                  </div>
                  <div className="text-xs text-white/30 font-mono mt-0.5">
                    {new Date(inv.createdAt).toLocaleString("es-MX")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xl font-extrabold" style={{ color: sc.color }}>
                    ${Number(inv.total || 0).toFixed(2)}
                  </div>
                  <a
                    href={`/api/billing/invoices/${inv.id}`}
                    target="_blank"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg,#6366F1,#A78BFA)",
                      color: "#fff",
                    }}
                  >
                    Ver invoice →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
        {!invoices.length && (
          <div className="py-14 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">🧾</div>
            <div>No hay facturas aún.</div>
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
