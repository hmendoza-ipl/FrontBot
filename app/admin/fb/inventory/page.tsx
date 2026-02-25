"use client";
import { useEffect, useState } from "react";

export default function InventoryPage() {
  const [items, setItems]   = useState<any[]>([]);
  const [form, setForm]     = useState({ sku: "", name: "", unit: "kg", cost: 0, stock: 0, minStock: 5 });
  const [move, setMove]     = useState<{ itemId: string; type: string; qty: number; reason: string }>({ itemId: "", type: "in", qty: 1, reason: "" });
  const [tab, setTab]       = useState<"list" | "new" | "move">("list");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/fb/items");
    const d = await r.json();
    setItems(d.items || []);
  }
  useEffect(() => { load(); }, []);

  async function createItem() {
    setSaving(true);
    await fetch("/api/fb/items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cost: Number(form.cost), stock: Number(form.stock), minStock: Number(form.minStock) }),
    });
    await load(); setSaving(false); setTab("list");
    setForm({ sku: "", name: "", unit: "kg", cost: 0, stock: 0, minStock: 5 });
  }

  async function applyMove() {
    if (!move.itemId) return;
    setSaving(true);
    await fetch("/api/fb/inventory/moves", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...move, qty: Number(move.qty) }),
    });
    await load(); setSaving(false); setTab("list");
  }

  const lowStock = items.filter(i => i.stock <= i.minStock);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">F&B</div>
            <div className="text-2xl font-bold">Inventario</div>
            <div className="text-sm text-white/50 mt-1">Ingredientes y suministros. Entradas, salidas y mermas.</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["list","move","new"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "bg-white/10 border border-white/20" : "border border-white/8 text-white/50"}`}>
                {t === "list" ? "Inventario" : t === "move" ? "⇄ Movimiento" : "+ Nuevo item"}
              </button>
            ))}
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="mt-4 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span>⚠️</span>
            <span className="text-sm text-red-400 font-medium">{lowStock.length} item{lowStock.length > 1 ? "s" : ""} bajo mínimo:</span>
            <span className="text-sm text-white/50">{lowStock.map(i => i.name).join(", ")}</span>
          </div>
        )}
      </div>

      {tab === "new" && (
        <div className="rounded-[22px] bg-white/[0.04] border border-cyan-500/20 p-5 space-y-3">
          <div className="font-semibold text-cyan-300 text-sm">Nuevo ítem de inventario</div>
          <div className="grid sm:grid-cols-3 gap-3">
            {([
              { label: "SKU", key: "sku", type: "text" },
              { label: "Nombre", key: "name", type: "text" },
              { label: "Costo unitario ($)", key: "cost", type: "number" },
              { label: "Stock inicial", key: "stock", type: "number" },
              { label: "Stock mínimo", key: "minStock", type: "number" },
            ] as any[]).map(f => (
              <div key={f.key}>
                <label className="text-xs text-white/40 mb-1 block">{f.label}</label>
                <input type={f.type} className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="text-xs text-white/40 mb-1 block">Unidad</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                <option value="kg">kg</option>
                <option value="lt">lt</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
          </div>
          <button onClick={createItem} disabled={saving}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Guardando…" : "✓ Crear ítem"}
          </button>
        </div>
      )}

      {tab === "move" && (
        <div className="rounded-[22px] bg-white/[0.04] border border-amber-500/20 p-5 space-y-3">
          <div className="font-semibold text-amber-300 text-sm">Registrar movimiento</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Ítem</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={move.itemId} onChange={e => setMove(p => ({ ...p, itemId: e.target.value }))}>
                <option value="">Selecciona…</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (stock: {i.stock} {i.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Tipo</label>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={move.type} onChange={e => setMove(p => ({ ...p, type: e.target.value }))}>
                <option value="in">📦 Entrada</option>
                <option value="out">📤 Salida / Consumo</option>
                <option value="waste">🗑️ Merma</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Cantidad</label>
              <input type="number" className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={move.qty} onChange={e => setMove(p => ({ ...p, qty: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Razón / Referencia</label>
              <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                value={move.reason} onChange={e => setMove(p => ({ ...p, reason: e.target.value }))}
                placeholder="Ej: consumo desayuno, compra, merma" />
            </div>
          </div>
          <button onClick={applyMove} disabled={saving || !move.itemId}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Aplicando…" : "⇄ Aplicar movimiento"}
          </button>
        </div>
      )}

      {tab === "list" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => {
            const pct = Math.min(100, (item.stock / Math.max(1, item.minStock * 3)) * 100);
            const isLow = item.stock <= item.minStock;
            return (
              <div key={item.id} className="rounded-[22px] border p-5"
                style={{
                  background: isLow ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                  borderColor: isLow ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-white/40 font-mono mt-0.5">{item.sku}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full font-mono"
                    style={{
                      background: isLow ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.1)",
                      color: isLow ? "#EF4444" : "#22C55E",
                    }}>
                    {isLow ? "⚠️ Bajo" : "✓ OK"}
                  </div>
                </div>
                <div className="text-3xl font-extrabold" style={{ color: isLow ? "#EF4444" : "#38BDF8" }}>
                  {item.stock} <span className="text-base font-normal text-white/40">{item.unit}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-white/8">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: isLow ? "#EF4444" : "#22C55E" }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-white/30">
                  <span>Mín: {item.minStock}</span>
                  <span>Costo: ${item.cost}/{item.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
