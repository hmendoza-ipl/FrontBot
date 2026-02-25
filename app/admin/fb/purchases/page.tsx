"use client";
import { useEffect, useState } from "react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Borrador",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  ordered:   { label: "Ordenado",  color: "#38BDF8", bg: "rgba(56,189,248,0.1)" },
  received:  { label: "Recibido",  color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  cancelled: { label: "Cancelado", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendors, setVendors]     = useState<any[]>([]);
  const [items, setItems]         = useState<any[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [vendorId, setVendorId]   = useState("");
  const [lines, setLines]         = useState<Array<{ itemId: string; qty: number; unitCost: number }>>([
    { itemId: "", qty: 1, unitCost: 0 },
  ]);

  async function load() {
    const [p, v, i] = await Promise.all([
      fetch("/api/fb/purchases").then(r => r.json()),
      fetch("/api/fb/vendors").then(r => r.json()),
      fetch("/api/fb/items").then(r => r.json()),
    ]);
    setPurchases(p.purchases || []);
    setVendors(v.vendors || []);
    setItems(i.items || []);
    if (!vendorId && v.vendors?.length) setVendorId(v.vendors[0].id);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const validLines = lines.filter(l => l.itemId && l.qty > 0);
    if (!validLines.length || !vendorId) return;
    setSaving(true);
    await fetch("/api/fb/purchases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, lines: validLines }),
    });
    await load(); setSaving(false); setShowForm(false);
    setLines([{ itemId: "", qty: 1, unitCost: 0 }]);
  }

  async function receive(purchaseId: string) {
    await fetch("/api/fb/purchases", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId, action: "receive" }),
    });
    load();
  }

  function itemName(id: string) { return items.find(i => i.id === id)?.name || id; }
  function vendorName(id: string) { return vendors.find(v => v.id === id)?.name || id; }

  function lineTotal(lines: any[]) {
    return lines.reduce((s: number, l: any) => s + l.qty * l.unitCost, 0);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">F&B</div>
            <div className="text-2xl font-bold">Órdenes de Compra</div>
            <div className="text-sm text-white/50 mt-1">Crea y recibe órdenes de compra a proveedores.</div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${showForm ? "bg-white/10 border border-white/20" : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"}`}>
            {showForm ? "Cancelar" : "+ Nueva orden"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-[22px] bg-white/[0.04] border border-cyan-500/20 p-5 space-y-4">
          <div className="font-semibold text-cyan-300 text-sm">Nueva orden de compra</div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Proveedor</label>
            <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
              value={vendorId} onChange={e => setVendorId(e.target.value)}>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div>
            <div className="text-xs text-white/40 mb-2">Líneas</div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end">
                  <select className="rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                    value={line.itemId}
                    onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l))}>
                    <option value="">Selecciona…</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                  <input type="number" placeholder="Cant." className="rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                    value={line.qty}
                    onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, qty: Number(e.target.value) } : l))} />
                  <input type="number" placeholder="Costo/u" className="rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                    value={line.unitCost}
                    onChange={e => setLines(ls => ls.map((l, i) => i === idx ? { ...l, unitCost: Number(e.target.value) } : l))} />
                  <button onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))}
                    className="size-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-center hover:bg-red-500/20 transition">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setLines(ls => [...ls, { itemId: "", qty: 1, unitCost: 0 }])}
              className="mt-2 px-3 py-2 rounded-xl text-xs text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/5 transition">
              + Agregar línea
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-white/40">
              Total estimado: <span className="text-white font-bold">${lineTotal(lines).toFixed(2)}</span>
            </div>
            <button onClick={create} disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "Creando…" : "✓ Crear orden"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {purchases.map(p => {
          const sc = statusConfig[p.status] || statusConfig.draft;
          const total = lineTotal(p.lines || []);
          return (
            <div key={p.id} className="rounded-[22px] border p-5"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: sc.color + "20" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold">OC-{p.id.slice(0, 6).toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    <span className="text-sm text-white/50">🏭 {vendorName(p.vendorId)}</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {(p.lines || []).map((l: any, i: number) => (
                      <div key={i} className="text-xs text-white/40">
                        • {l.qty} × {itemName(l.itemId)} @ ${l.unitCost}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-white/30 mt-2">{new Date(p.createdAt).toLocaleString("es-MX")}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold" style={{ color: sc.color }}>${total.toFixed(2)}</div>
                  {p.status === "draft" || p.status === "ordered" ? (
                    <button onClick={() => receive(p.id)}
                      className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition">
                      ✓ Recibir
                    </button>
                  ) : p.status === "received" ? (
                    <div className="mt-2 text-xs text-emerald-400">
                      Recibido {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString("es-MX") : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {!purchases.length && (
          <div className="py-16 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">📦</div>
            <div>Sin órdenes de compra.</div>
          </div>
        )}
      </div>
    </div>
  );
}
