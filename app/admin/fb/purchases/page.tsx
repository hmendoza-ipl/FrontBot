"use client";

import { useEffect, useMemo, useState } from "react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: "Borrador",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  ordered:   { label: "Ordenado",  color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)" },
  received:  { label: "Recibido ✅", color: "#22C55E", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)" },
  cancelled: { label: "Cancelado", color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)" },
};

export default function PurchasesPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [receiving, setReceiving] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<any>({
    vendorId: "",
    lines: [{ itemId: "", qty: 1, unitCost: 0 }],
  });

  async function load() {
    const [v, i, p] = await Promise.all([
      fetch("/api/fb/vendors").then((r) => r.json()),
      fetch("/api/fb/items").then((r) => r.json()),
      fetch("/api/fb/purchases").then((r) => r.json()),
    ]);
    setVendors(v.vendors || []);
    setItems(i.items || []);
    setPurchases(p.purchases || []);
    if (!form.vendorId && v.vendors?.[0]?.id)
      setForm((x: any) => ({ ...x, vendorId: v.vendors[0].id }));
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function itemName(id: string) { return items.find((x: any) => x.id === id)?.name || id; }
  function itemUnit(id: string) { return items.find((x: any) => x.id === id)?.unit || ""; }
  function vendorName(id: string) { return vendors.find((x: any) => x.id === id)?.name || id; }

  function setLine(idx: number, patch: any) {
    setForm((p: any) => {
      const lines = [...p.lines];
      lines[idx] = { ...lines[idx], ...patch };
      return { ...p, lines };
    });
  }

  function addLine() {
    setForm((p: any) => ({ ...p, lines: [...p.lines, { itemId: "", qty: 1, unitCost: 0 }] }));
  }

  function removeLine(idx: number) {
    setForm((p: any) => ({ ...p, lines: p.lines.filter((_: any, i: number) => i !== idx) }));
  }

  const subtotal = useMemo(() => {
    return (form.lines || []).reduce((s: number, l: any) => s + Number(l.qty || 0) * Number(l.unitCost || 0), 0);
  }, [form.lines]);

  async function createPurchase() {
    if (!form.vendorId) return showToast("Selecciona un proveedor", false);
    const clean = form.lines.filter((l: any) => l.itemId && l.qty > 0);
    if (!clean.length) return showToast("Agrega al menos una línea válida", false);
    setSaving(true);
    const r = await fetch("/api/fb/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: form.vendorId, lines: clean }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) return showToast(d?.error || "Error", false);
    showToast("✅ Compra creada (draft)");
    setForm((p: any) => ({ vendorId: p.vendorId, lines: [{ itemId: "", qty: 1, unitCost: 0 }] }));
    await load();
  }

  async function receive(purchaseId: string) {
    setReceiving(purchaseId);
    const r = await fetch("/api/fb/purchases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId, action: "receive" }),
    });
    const d = await r.json();
    setReceiving("");
    if (!r.ok) return showToast(d?.error || "Error", false);
    showToast("✅ Recibida · stock actualizado");
    await load();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">F&B</div>
            <div className="text-2xl font-bold">Compras</div>
            <div className="text-sm text-white/50 mt-1">Crear orden y recibir para actualizar stock.</div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Total OC", value: purchases.length, color: "#94a3b8" },
              { label: "Pendientes", value: purchases.filter(p => p.status !== "received" && p.status !== "cancelled").length, color: "#38BDF8" },
              { label: "Recibidas", value: purchases.filter(p => p.status === "received").length, color: "#22C55E" },
            ].map(k => (
              <div key={k.label} className="rounded-2xl px-4 py-3 bg-black/20 border border-white/6">
                <div className="text-xl font-extrabold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Crear compra */}
      <div className="rounded-[22px] bg-white/[0.05] border border-white/10 p-5 space-y-4">
        <div className="text-sm font-semibold text-cyan-300">Nueva orden de compra</div>

        <div>
          <div className="text-xs text-white/50 mb-1.5">Proveedor</div>
          <select
            className="w-full sm:w-80 rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
            value={form.vendorId}
            onChange={(e) => setForm((p: any) => ({ ...p, vendorId: e.target.value }))}
          >
            <option value="">Selecciona…</option>
            {vendors.map((v: any) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {/* Líneas */}
        <div className="space-y-2">
          <div className="text-xs text-white/40 grid grid-cols-[1fr_80px_100px_32px] gap-2 px-1">
            <span>Producto</span><span>Cantidad</span><span>Costo/u</span><span />
          </div>
          {(form.lines || []).map((l: any, idx: number) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
              <select
                className="rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={l.itemId}
                onChange={(e) => setLine(idx, { itemId: e.target.value })}
              >
                <option value="">Producto…</option>
                {items.map((i: any) => (
                  <option key={i.id} value={i.id}>{i.sku} • {i.name}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={l.qty}
                onChange={(e) => setLine(idx, { qty: Number(e.target.value) })}
                placeholder="Qty"
              />
              <input
                type="number"
                min={0}
                className="rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
                value={l.unitCost}
                onChange={(e) => setLine(idx, { unitCost: Number(e.target.value) })}
                placeholder="$0.00"
              />
              <button
                onClick={() => removeLine(idx)}
                className="size-8 rounded-xl flex items-center justify-center text-red-400 text-sm hover:bg-red-500/10 transition"
                style={{ border: "1px solid rgba(239,68,68,0.2)" }}
              >✕</button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={addLine}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/8 transition"
          >+ Agregar línea</button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-white/50">
              Subtotal: <b className="text-white">${subtotal.toFixed(2)}</b>
            </div>
            <button
              onClick={createPurchase}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {saving ? "Creando…" : "Crear compra"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de compras */}
      <div className="space-y-3">
        {purchases.map((p: any) => {
          const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
          const total = (p.lines || []).reduce((s: number, l: any) => s + Number(l.qty) * Number(l.unitCost), 0);
          return (
            <div key={p.id} className="rounded-[22px] border p-5"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: sc.border }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold">{vendorName(p.vendorId)}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 mt-1 font-mono">
                    {p.id.slice(0, 8)}… · {new Date(p.createdAt).toLocaleString("es-MX")}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(p.lines || []).map((l: any, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-lg bg-white/5 border border-white/8 text-white/60">
                        {l.qty}× {itemName(l.itemId)} ({itemUnit(l.itemId)}) · ${l.unitCost}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <div className="text-xl font-extrabold" style={{ color: sc.color }}>${total.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => receive(p.id)}
                    disabled={p.status === "received" || p.status === "cancelled" || receiving === p.id}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                    style={{
                      background: p.status === "received" ? "rgba(34,197,94,0.1)" : "rgba(56,189,248,0.15)",
                      border: p.status === "received" ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(56,189,248,0.25)",
                      color: p.status === "received" ? "#22C55E" : "#38BDF8",
                    }}
                  >
                    {receiving === p.id ? "…" : p.status === "received" ? "✅ Recibida" : "Recibir"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!purchases.length && (
          <div className="py-14 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">🛒</div>
            <div>No hay compras aún.</div>
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
