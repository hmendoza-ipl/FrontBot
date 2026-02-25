"use client";
import { useEffect, useState } from "react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [form, setForm]       = useState({ name: "", email: "", phone: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);

  async function load() {
    const r = await fetch("/api/fb/vendors");
    const d = await r.json();
    setVendors(d.vendors || []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/fb/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await load();
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", email: "", phone: "" });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">F&B</div>
            <div className="text-2xl font-bold">Proveedores</div>
            <div className="text-sm text-white/50 mt-1">Directorio de proveedores de alimentos y bebidas.</div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${showForm ? "bg-white/10 border border-white/20" : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"}`}>
            {showForm ? "Cancelar" : "+ Nuevo proveedor"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-[22px] bg-white/[0.04] border border-cyan-500/20 p-5 space-y-3">
          <div className="font-semibold text-cyan-300 text-sm">Nuevo proveedor</div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Nombre *", key: "name", placeholder: "Distribuidora XYZ" },
              { label: "Email", key: "email", placeholder: "ventas@proveedor.com" },
              { label: "Teléfono", key: "phone", placeholder: "555-0000" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-white/40 mb-1 block">{f.label}</label>
                <input className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm outline-none"
                  value={(form as any)[f.key]}
                  placeholder={f.placeholder}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={create} disabled={saving || !form.name.trim()}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Guardando…" : "✓ Crear proveedor"}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {vendors.map(v => (
          <div key={v.id} className="rounded-[22px] bg-white/[0.04] border border-white/8 p-5">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.15)" }}>
                🏭
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{v.name}</div>
                <div className="mt-1 space-y-0.5">
                  {v.email && <div className="text-xs text-white/50 flex items-center gap-1.5">📧 {v.email}</div>}
                  {v.phone && <div className="text-xs text-white/50 flex items-center gap-1.5">📞 {v.phone}</div>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {!vendors.length && (
          <div className="col-span-2 py-16 text-center text-white/30 rounded-[22px] border border-white/6 bg-white/[0.02]">
            <div className="text-4xl mb-3">🏭</div>
            <div>Sin proveedores. Agrega el primero arriba.</div>
          </div>
        )}
      </div>
    </div>
  );
}
