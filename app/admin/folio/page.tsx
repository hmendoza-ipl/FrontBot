"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const typeColors: Record<string, { color: string; bg: string }> = {
  room:     { color: "#38BDF8", bg: "rgba(56,189,248,0.12)" },
  fb:       { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  minibar:  { color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
  laundry:  { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  spa:      { color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  other:    { color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
};

const payMethodIcon: Record<string, string> = {
  transfer: "🏦", card: "💳", cash: "💵",
};

function FolioContent() {
  const sp = useSearchParams();
  const reservationId = sp.get("res") || "res1";

  const [data, setData]       = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [chargeForm, setChargeForm] = useState({ type: "fb", description: "Desayuno buffet", qty: 1, unitPrice: 180 });
  const [payForm, setPayForm]       = useState({ amount: 500, method: "transfer", reference: "" });
  const [tab, setTab]               = useState<"charges" | "payments">("charges");

  async function load() {
    const r = await fetch(`/api/hotel/folio/${reservationId}`);
    setData(await r.json());
  }
  async function loadReservations() {
    const r = await fetch("/api/hotel/reservations");
    const d = await r.json();
    setReservations(d.reservations || []);
  }
  useEffect(() => { load(); loadReservations(); }, [reservationId]);

  async function addCharge() {
    await fetch(`/api/hotel/folio/${reservationId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chargeForm),
    });
    load();
  }

  async function addPayment() {
    await fetch("/api/hotel/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId, ...payForm, amount: Number(payForm.amount) }),
    });
    load();
  }

  async function createInvoice() {
    const r = await fetch("/api/billing/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });
    const d = await r.json();
    setInvoiceId(d.invoice.id);
  }

  const currentRes = reservations.find((r: any) => r.id === reservationId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Hotel PMS</div>
            <div className="text-2xl font-bold">Folio</div>
            {currentRes && (
              <div className="flex items-center gap-3 mt-1 text-sm text-white/60 flex-wrap">
                <span>📋 {currentRes.code}</span>
                {currentRes.guestName && <span>👤 {currentRes.guestName}</span>}
                <span>🛏️ Hab {currentRes.roomId?.replace("r", "")}</span>
                <span className="font-mono text-xs text-white/40">{reservationId}</span>
              </div>
            )}
          </div>

          {/* Reservation switcher */}
          <select className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none"
            value={reservationId}
            onChange={e => window.location.href = `/admin/folio?res=${e.target.value}`}>
            {reservations.map((r: any) => (
              <option key={r.id} value={r.id}>{r.code} — {r.guestName || r.guestId} ({r.status})</option>
            ))}
          </select>
        </div>

        {/* Balance cards */}
        {data && (
          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 bg-black/25 border border-white/8">
              <div className="text-xs text-white/40 mb-1">Total cargos</div>
              <div className="text-2xl font-extrabold text-cyan-400">${data.totalCharges.toFixed(2)}</div>
            </div>
            <div className="rounded-2xl p-4 bg-black/25 border border-white/8">
              <div className="text-xs text-white/40 mb-1">Total pagado</div>
              <div className="text-2xl font-extrabold text-emerald-400">${data.totalPaid.toFixed(2)}</div>
            </div>
            <div className="rounded-2xl p-4 border"
              style={{
                background: data.balance > 0 ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                borderColor: data.balance > 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
              }}>
              <div className="text-xs text-white/40 mb-1">Saldo</div>
              <div className="text-2xl font-extrabold" style={{ color: data.balance > 0 ? "#EF4444" : "#22C55E" }}>
                {data.balance > 0 ? "-" : "✓ "}${Math.abs(data.balance).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forms row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Add charge */}
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5 space-y-3">
          <div className="font-semibold text-sm flex items-center gap-2">
            <span className="size-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">+</span>
            Agregar cargo / consumo
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Tipo</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={chargeForm.type}
                onChange={e => setChargeForm(p => ({ ...p, type: e.target.value }))}>
                {["room", "fb", "minibar", "laundry", "spa", "other"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Descripción</label>
              <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={chargeForm.description}
                onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Cantidad</label>
              <input type="number" className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={chargeForm.qty}
                onChange={e => setChargeForm(p => ({ ...p, qty: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Precio unitario</label>
              <input type="number" className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={chargeForm.unitPrice}
                onChange={e => setChargeForm(p => ({ ...p, unitPrice: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/40">
              Subtotal: <span className="text-white font-semibold">${(chargeForm.qty * chargeForm.unitPrice).toFixed(2)}</span>
            </div>
            <button onClick={addCharge}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition">
              + Agregar
            </button>
          </div>
        </div>

        {/* Add payment + invoice */}
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5 space-y-3">
          <div className="font-semibold text-sm flex items-center gap-2">
            <span className="size-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs">💳</span>
            Registrar pago
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Método</label>
            <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
              value={payForm.method}
              onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
              <option value="transfer">🏦 Transferencia</option>
              <option value="card">💳 Tarjeta</option>
              <option value="cash">💵 Efectivo</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Referencia</label>
            <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
              value={payForm.reference}
              onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))}
              placeholder="TRX-12345" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Monto</label>
            <input type="number" className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
              value={payForm.amount}
              onChange={e => setPayForm(p => ({ ...p, amount: Number(e.target.value) }))} />
          </div>
          <button onClick={addPayment}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition">
            ✓ Registrar pago
          </button>

          <div className="pt-3 border-t border-white/8 flex items-center gap-3">
            <button onClick={createInvoice}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/8 transition">
              🧾 Generar factura
            </button>
            {invoiceId && (
              <a href={`/api/billing/invoices/${invoiceId}`} target="_blank"
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition">
                Ver →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Folio detail */}
      {data && (
        <div className="rounded-[22px] bg-white/[0.04] border border-white/8 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {(["charges", "payments"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-3 text-sm font-medium flex-1 transition border-b-2 ${
                  tab === t ? "border-cyan-400 text-cyan-300" : "border-transparent text-white/40 hover:text-white/60"
                }`}>
                {t === "charges" ? `Cargos (${data.items.length})` : `Pagos (${data.payments.length})`}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-2">
            {tab === "charges" && (
              <>
                {data.items.map((item: any) => {
                  const tc = typeColors[item.type] || typeColors.other;
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                        style={{ background: tc.bg, color: tc.color }}>
                        {item.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.description}</div>
                        <div className="text-xs text-white/40">{new Date(item.createdAt).toLocaleString("es-MX")}</div>
                      </div>
                      <div className="text-xs text-white/50 shrink-0">{item.qty} × ${item.unitPrice}</div>
                      <div className="font-semibold text-sm shrink-0">${(item.qty * item.unitPrice).toFixed(2)}</div>
                    </div>
                  );
                })}
                {!data.items.length && <div className="text-center text-white/30 py-8">Sin cargos</div>}
              </>
            )}

            {tab === "payments" && (
              <>
                {data.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-xl">{payMethodIcon[p.method] || "💳"}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium capitalize">{p.method}</div>
                      {p.reference && <div className="text-xs text-white/40 font-mono">{p.reference}</div>}
                    </div>
                    <div className="font-bold text-emerald-400">${p.amount.toFixed(2)}</div>
                  </div>
                ))}
                {!data.payments.length && <div className="text-center text-white/30 py-8">Sin pagos</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FolioPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white/40">Cargando…</div>}>
      <FolioContent />
    </Suspense>
  );
}
