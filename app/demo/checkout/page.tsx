"use client";

import { useEffect, useState } from "react";
import { getDemoUser } from "@/lib/demoAuth";
import { useRouter } from "next/navigation";

const steps = [
  { id: 1, icon: "🛏️", title: "Revisión de habitación", status: "done", time: "08:00" },
  { id: 2, icon: "🧾", title: "Factura preparada", status: "done", time: "08:30" },
  { id: 3, icon: "💳", title: "Pago procesado", status: "active", time: "Pendiente" },
  { id: 4, icon: "🔑", title: "Entrega de llaves", status: "pending", time: "—" },
  { id: 5, icon: "🚕", title: "Taxi al aeropuerto", status: "pending", time: "—" },
];

const charges = [
  { desc: "Habitación (3 noches)", amount: "$3,600" },
  { desc: "Room service (2 órdenes)", amount: "$480" },
  { desc: "Minibar", amount: "$120" },
  { desc: "IVA (16%)", amount: "$672" },
];

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null);
  const [requested, setRequested] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const u = getDemoUser();
    if (!u) { router.push("/demo-login"); return; }
    setUser(u);
  }, []);

  async function requestCheckout() {
    if (!user) return;
    await fetch("/api/demo/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: user.hotelId,
        guestId: user.id,
        areaId: "a_frontdesk",
        title: "Checkout Express",
        description: `Checkout express solicitado para habitación ${user.roomNumber}`,
        priority: "high",
      }),
    });
    setRequested(true);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-semibold">Checkout Express</div>
            <div className="text-sm text-white/50 mt-1">Hab. {user?.roomNumber} · {user?.fullName}</div>
          </div>
          <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
            Check-out hoy
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-[22px] bg-white/[0.05] border border-white/8 p-5">
        <div className="font-semibold mb-4">Estado del proceso</div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className={`size-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                step.status === "done" ? "bg-emerald-500/20 border border-emerald-500/30" :
                step.status === "active" ? "bg-amber-500/20 border border-amber-500/30" :
                "bg-white/5 border border-white/8 opacity-40"
              }`}>
                {step.status === "done" ? "✅" : step.icon}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${step.status === "pending" ? "text-white/40" : ""}`}>
                  {step.title}
                </div>
              </div>
              <div className={`text-xs font-mono ${
                step.status === "done" ? "text-emerald-400" :
                step.status === "active" ? "text-amber-400" :
                "text-white/30"
              }`}>
                {step.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charges */}
      <div className="rounded-[22px] bg-white/[0.05] border border-white/8 p-5">
        <div className="font-semibold mb-4">Resumen de cuenta</div>
        <div className="space-y-2">
          {charges.map((c) => (
            <div key={c.desc} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="text-sm text-white/70">{c.desc}</div>
              <div className="text-sm font-mono">{c.amount}</div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-bold">
            <div>Total</div>
            <div className="text-cyan-400 font-mono text-lg">$4,872</div>
          </div>
        </div>
      </div>

      {/* Action */}
      {!requested ? (
        <button
          onClick={requestCheckout}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
        >
          🚀 Solicitar Checkout Express
        </button>
      ) : (
        <div className="w-full py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-center text-lg">
          ✅ Checkout solicitado · El staff llegará en breve
        </div>
      )}

      <div className="text-xs text-white/30 text-center">
        Al hacer checkout confirmas que la habitación ha sido desocupada
      </div>
    </div>
  );
}
