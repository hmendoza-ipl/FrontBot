"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "guest" | "staff" | "supervisor" | "admin";

const roleInfo = {
  guest: { label: "Huésped", icon: "🛎️", desc: "Accede al chat y solicitudes", color: "#38BDF8" },
  staff: { label: "Staff", icon: "👷", desc: "Ver tickets de su área", color: "#22C55E" },
  supervisor: { label: "Supervisor", icon: "👔", desc: "Supervisar áreas y SLAs", color: "#F59E0B" },
  admin: { label: "Admin", icon: "⚙️", desc: "Panel completo + takeover", color: "#6366F1" },
};

export default function DemoLogin() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("guest");
  const [room, setRoom] = useState("502");
  const [name, setName] = useState("Carlos García");

  function enter() {
    const demoUser = {
      id: role === "guest" ? "guest_demo" : `${role}_demo`,
      role,
      hotelId: "hotel_demo_1",
      fullName: name,
      roomNumber: role === "guest" ? room : undefined,
    };
    localStorage.setItem("frontbot_demo_user", JSON.stringify(demoUser));
    router.push(role === "guest" ? "/demo" : "/admin");
  }

  const selected = roleInfo[role];

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-3">
            <Image src="/logo.png" alt="Frontbot" width={72} height={72} className="rounded-2xl shadow-lg shadow-cyan-500/20" />
            <div>
              <div className="text-xs text-cyan-400 font-mono tracking-widest uppercase">Qubica.AI</div>
              <div className="font-bold text-xl">Frontbot</div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="font-semibold text-lg">Demo Login</div>
            <div className="text-xs text-white/50 mt-1 font-mono">Sin contraseñas · Solo para demo</div>
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <label className="text-xs text-white/50 font-mono uppercase tracking-wider mb-2 block">Selecciona tu rol</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(roleInfo) as [Role, typeof roleInfo.guest][]).map(([r, info]) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    role === r
                      ? "bg-white/10 border-white/30"
                      : "bg-black/20 border-white/8 hover:border-white/15"
                  }`}
                >
                  <div className="text-xl mb-1">{info.icon}</div>
                  <div className="font-semibold text-sm">{info.label}</div>
                  <div className="text-xs text-white/50">{info.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected role badge */}
          <div
            className="mb-4 px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-2"
            style={{ borderColor: `${selected.color}40`, backgroundColor: `${selected.color}10`, color: selected.color }}
          >
            <span>{selected.icon}</span>
            <span>Entrando como: {selected.label}</span>
          </div>

          {/* Name input */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/50 font-mono uppercase tracking-wider mb-1.5 block">Nombre</label>
              <input
                className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm focus:border-cyan-500/50 transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>

            {role === "guest" && (
              <div>
                <label className="text-xs text-white/50 font-mono uppercase tracking-wider mb-1.5 block">Habitación</label>
                <input
                  className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none text-sm focus:border-cyan-500/50 transition"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Número de habitación"
                />
              </div>
            )}

            <button
              onClick={enter}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 hover:opacity-90 transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              Entrar a la demo
              <span>→</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-white/30 font-mono">
          Los datos se guardan en localStorage del navegador
        </div>
      </div>
    </main>
  );
}
