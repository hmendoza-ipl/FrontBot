import Image from "next/image";
import Link from "next/link";

export default function Landing() {
  const features = [
    { icon: "🤖", title: "IA Concierge", desc: "Responde 24/7 en el idioma del huésped" },
    { icon: "🎫", title: "Tickets por área", desc: "Housekeeping, Room Service, Mantenimiento..." },
    { icon: "💬", title: "Chat en vivo", desc: "Takeover humano con un clic" },
    { icon: "⏱️", title: "SLA Dashboard", desc: "Métricas de tiempos por área en tiempo real" },
    { icon: "📧", title: "Email alerts", desc: "Notificaciones automáticas via Resend" },
    { icon: "🔗", title: "n8n Ready", desc: "Webhooks listos para conectar tu IA" },
  ];

  const quickActions = [
    ["Toallas extra", "Housekeeping", "#38BDF8"],
    ["Ordenar comida", "Room Service", "#F59E0B"],
    ["Problema A/C", "Maintenance", "#EF4444"],
    ["Late checkout", "Front Desk", "#6366F1"],
    ["Taxi / Tour", "Concierge", "#22C55E"],
    ["Queja ruido", "Security", "#EC4899"],
  ];

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Frontbot" width={56} height={56} className="rounded-2xl shadow-lg shadow-cyan-500/20" />
                <div>
                  <div className="text-xs text-cyan-400 font-mono tracking-widest uppercase">Qubica.AI</div>
                  <div className="font-semibold text-lg leading-none">Frontbot</div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-cyan-300 font-mono">DEMO EN VIVO • Concierge IA + Operación Hotel</span>
                </div>

                <h1 className="text-5xl sm:text-6xl font-bold leading-[0.95] tracking-tight">
                  El conserje
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    inteligente
                  </span>
                  <br />
                  de tu hotel
                </h1>
              </div>

              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                Solicitudes por WhatsApp o app, tickets automáticos por área, 
                escalación a supervisores y modo intervención humana. Todo en tiempo real.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/demo-login"
                  className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                >
                  Entrar a la demo
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link
                  href="/demo"
                  className="px-6 py-3.5 rounded-2xl bg-white/8 border border-white/10 hover:bg-white/12 transition font-medium"
                >
                  Ver módulo huésped
                </Link>
                <Link
                  href="/admin"
                  className="px-6 py-3.5 rounded-2xl bg-white/8 border border-white/10 hover:bg-white/12 transition font-medium"
                >
                  Panel admin
                </Link>
              </div>

              <div className="text-xs text-white/30 font-mono">
                ⚡ Demo sin autenticación estricta · Datos en memoria del servidor
              </div>
            </div>

            {/* Right - Preview card */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-tr from-cyan-500/15 via-indigo-500/15 to-emerald-500/10 blur-3xl rounded-[50px]" />
              <div className="relative rounded-[32px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-6 shadow-2xl">
                
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm">🏨</div>
                    <div>
                      <div className="font-semibold text-sm">Grand Hotel Demo</div>
                      <div className="text-xs text-white/50">Hab. 502 · Carlos García</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-mono">Online</span>
                  </div>
                </div>

                {/* Quick actions grid */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {quickActions.map(([title, area, color]) => (
                    <div
                      key={title}
                      className="p-3 rounded-2xl bg-black/20 border border-white/8 hover:border-white/15 transition cursor-default"
                    >
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-xs mt-0.5" style={{ color: `${color}99` }}>{area}</div>
                    </div>
                  ))}
                </div>

                {/* Chat preview */}
                <div className="rounded-2xl bg-black/20 border border-white/8 p-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="size-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-[10px]">🤖</div>
                    <div className="bg-cyan-500/15 border border-cyan-500/20 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-white/80 max-w-[80%]">
                      ¡Hola Carlos! ¿En qué puedo ayudarte hoy?
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-white text-black rounded-xl rounded-tr-sm px-3 py-2 text-xs max-w-[80%]">
                      Necesito toallas extra por favor
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="size-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-[10px]">🤖</div>
                    <div className="bg-cyan-500/15 border border-cyan-500/20 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-white/80 max-w-[80%]">
                      ✅ Ticket creado. Housekeeping llegará en ~20 min.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features row */}
          <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white/[0.04] border border-white/8 p-5 hover:bg-white/[0.07] transition">
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="font-semibold text-sm">{f.title}</div>
                <div className="text-xs text-white/50 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/30">
          <span>Frontbot · Qubica.AI</span>
          <span className="font-mono">Demo v1.0</span>
        </div>
      </footer>
    </main>
  );
}
