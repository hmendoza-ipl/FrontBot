"use client";

import { useEffect, useState } from "react";

type Vendor = { id: string; name: string; email?: string; phone?: string };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  async function load() {
    const r = await fetch("/api/fb/vendors");
    const d = await r.json();
    setVendors(d.vendors || []);
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function create() {
    if (!form.name.trim()) return showToast("Nombre requerido", false);
    setSaving(true);
    const r = await fetch("/api/fb/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) return showToast(d?.error || "Error", false);
    setForm({ name: "", email: "", phone: "" });
    await load();
    showToast(`✅ ${d.vendor.name} creado`);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">F&B</div>
        <div className="text-2xl font-bold">Proveedores</div>
        <div className="text-sm text-white/50 mt-1">Lista y alta rápida de proveedores.</div>
      </div>

      {/* Formulario alta */}
      <div className="rounded-[22px] bg-white/[0.05] border border-white/10 p-5">
        <div className="text-sm font-semibold text-cyan-300 mb-4">Nuevo proveedor</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-white/50 mb-1.5">Nombre *</div>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Distribuidora XYZ…"
            />
          </div>
          <div>
            <div className="text-xs text-white/50 mb-1.5">Email</div>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="ventas@proveedor.com"
            />
          </div>
          <div>
            <div className="text-xs text-white/50 mb-1.5">Teléfono</div>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="55…"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              onClick={create}
              disabled={saving || !form.name.trim()}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {saving ? "Guardando…" : "Crear proveedor"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="grid sm:grid-cols-2 gap-3">
        {vendors.map((v) => (
          <div key={v.id} className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5 flex items-start gap-4">
            <div className="size-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.15)" }}>
              🏭
            </div>
            <div>
              <div className="font-semibold">{v.name}</div>
              <div className="text-sm text-white/50 mt-1">
                {v.email && <span className="mr-3">📧 {v.email}</span>}
                {v.phone && <span>📞 {v.phone}</span>}
                {!v.email && !v.phone && <span className="text-white/30">Sin contacto registrado</span>}
              </div>
            </div>
          </div>
        ))}
        {!vendors.length && (
          <div className="col-span-2 py-14 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">🏭</div>
            <div>Aún no hay proveedores.</div>
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
