"use client";

import { useEffect, useMemo, useState } from "react";

type FBItem = {
  id: string;
  sku: string;
  name: string;
  unit: "pcs" | "kg" | "lt";
  cost: number;
  stock: number;
  minStock: number;
};

const MOVE_CONFIG = {
  in:    { label: "Entrada",  icon: "📦", color: "#22C55E", glow: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)" },
  out:   { label: "Salida",   icon: "📤", color: "#38BDF8", glow: "rgba(56,189,248,0.15)",  border: "rgba(56,189,248,0.3)" },
  waste: { label: "Merma",    icon: "🗑️", color: "#EF4444", glow: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)" },
};

export default function FBInventoryPage() {
  const [items, setItems] = useState<FBItem[]>([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [move, setMove] = useState<{
    itemId: string;
    type: "in" | "out" | "waste";
    qty: number;
    reason: string;
    ref?: string;
  }>({
    itemId: "",
    type: "in",
    qty: 1,
    reason: "manual_adjustment",
    ref: "",
  });

  async function load() {
    const r = await fetch("/api/fb/items");
    const d = await r.json();
    setItems(d.items || []);
  }

  useEffect(() => { load(); }, []);

  const view = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => `${i.sku} ${i.name}`.toLowerCase().includes(s));
  }, [items, q]);

  const lowStockItems = useMemo(() => items.filter(i => i.stock <= i.minStock), [items]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function submitMove() {
    if (!move.itemId) return showToast("Selecciona un producto", false);
    if (!move.qty || move.qty <= 0) return showToast("Cantidad inválida", false);
    setSaving(true);
    const r = await fetch("/api/fb/inventory/moves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...move, qty: Number(move.qty) }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) return showToast(d?.error || "Error al registrar", false);
    await load();
    const item = items.find(i => i.id === move.itemId);
    const mc = MOVE_CONFIG[move.type];
    showToast(`${mc.icon} ${mc.label} registrada: ${move.qty} ${item?.unit || ""} de ${item?.name || ""}`);
    setMove(p => ({ ...p, itemId: "", qty: 1, reason: "manual_adjustment" }));
  }

  function quickMove(item: FBItem, type: "in" | "out" | "waste") {
    setMove({ itemId: item.id, type, qty: 1, reason: type === "in" ? "manual_in" : type === "out" ? "consumption" : "waste", ref: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function lowStock(i: FBItem) { return i.stock <= i.minStock; }

  const mc = MOVE_CONFIG[move.type];
  const selectedItem = items.find(i => i.id === move.itemId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">F&B</div>
            <div className="text-2xl font-bold">Inventario</div>
            <div className="text-sm text-white/50 mt-1">Entradas, salidas, merma y mínimos.</div>
          </div>
          <input
            className="w-full sm:w-[320px] rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
            placeholder="🔍 Buscar por SKU o nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {lowStockItems.length > 0 && (
          <div className="mt-4 rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <span className="shrink-0">⚠️</span>
            <div>
              <div className="text-sm font-semibold text-amber-300">
                {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} bajo el mínimo
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                {lowStockItems.map(i => `${i.name} (${i.stock}/${i.minStock} ${i.unit})`).join(" · ")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel de movimiento */}
      <div className="rounded-[22px] border p-5 transition-all"
        style={{ background: `${mc.glow}`, borderColor: mc.border }}>
        <div className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: mc.color }}>
          {mc.icon} Registrar movimiento
          {selectedItem && (
            <span className="ml-1 text-xs font-normal text-white/50">
              → {selectedItem.name} · stock actual:{" "}
              <b className="text-white">{selectedItem.stock} {selectedItem.unit}</b>
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <div className="text-xs text-white/50 mb-1.5">Producto</div>
            <select
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={move.itemId}
              onChange={(e) => setMove((p) => ({ ...p, itemId: e.target.value }))}
            >
              <option value="">Selecciona…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.sku} • {i.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-white/50 mb-1.5">Tipo</div>
            <select
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={move.type}
              onChange={(e) => setMove((p) => ({ ...p, type: e.target.value as any }))}
            >
              <option value="in">📦 Entrada</option>
              <option value="out">📤 Salida</option>
              <option value="waste">🗑️ Merma</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-white/50 mb-1.5">Cantidad</div>
            <input
              type="number"
              min={1}
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={move.qty}
              onChange={(e) => setMove((p) => ({ ...p, qty: Number(e.target.value) }))}
            />
          </div>

          <div>
            <div className="text-xs text-white/50 mb-1.5">Motivo / Ref</div>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={move.reason}
              onChange={(e) => setMove((p) => ({ ...p, reason: e.target.value }))}
              placeholder="purchase / consumption…"
            />
          </div>

          <div className="md:col-span-5 flex items-center justify-between gap-3 flex-wrap">
            {selectedItem && move.qty > 0 && (
              <div className="text-xs text-white/40">
                Stock resultante:{" "}
                <span className="font-bold" style={{ color: mc.color }}>
                  {move.type === "in"
                    ? selectedItem.stock + Number(move.qty)
                    : Math.max(0, selectedItem.stock - Number(move.qty))
                  } {selectedItem.unit}
                </span>
              </div>
            )}
            <button
              onClick={submitMove}
              disabled={saving || !move.itemId || !move.qty}
              className="ml-auto px-6 py-3 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
              style={{ background: mc.color, color: "#000" }}
            >
              {saving ? "Guardando…" : "⇄ Registrar movimiento"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="grid gap-3">
        {view.map((i) => (
          <div
            key={i.id}
            className="rounded-[22px] border p-5"
            style={{
              background: lowStock(i) ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)",
              borderColor: lowStock(i) ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">{i.sku} · {i.name}</div>
                <div className="text-sm text-white/50 mt-1">
                  Stock:{" "}
                  <b style={{ color: lowStock(i) ? "#F59E0B" : "#38BDF8" }}>{i.stock}</b>{" "}
                  {i.unit} · Mínimo: {i.minStock} · Costo: ${i.cost}/{i.unit}
                </div>
                {lowStock(i) && (
                  <span className="mt-2 inline-flex text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                    ⚠️ Bajo stock
                  </span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {(["in", "out", "waste"] as const).map(type => {
                  const cfg = MOVE_CONFIG[type];
                  return (
                    <button key={type}
                      onClick={() => quickMove(i, type)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition"
                      style={{ background: cfg.glow, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (i.stock / Math.max(1, i.minStock * 3)) * 100)}%`,
                  background: lowStock(i) ? "#F59E0B" : "#22C55E",
                  transition: "width 0.5s ease",
                }} />
            </div>
          </div>
        ))}
        {!view.length && (
          <div className="py-14 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">📦</div>
            <div>No hay items{q ? ` para "${q}"` : ""}.</div>
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
