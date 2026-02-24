"use client";

import { useEffect, useState } from "react";
import { getDemoUser } from "@/lib/demoAuth";
import { ChatPanel } from "@/components/ChatPanel";
import { useRouter } from "next/navigation";

export default function AdminConversations() {
  const [user, setUser] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<string>("");
  const router = useRouter();

  async function load(u: any) {
    const r = await fetch(`/api/demo/conversations?hotelId=${u.hotelId}`);
    const data = await r.json();
    const list = data.conversations || [];
    setConvs(list);
    if (!active && list[0]?.id) setActive(list[0].id);
  }

  useEffect(() => {
    const u = getDemoUser();
    if (!u) { router.push("/demo-login"); return; }
    setUser(u);
    load(u);
    const it = setInterval(() => load(u), 1200);
    return () => clearInterval(it);
  }, [active]);

  const current = convs.find((c) => c.id === active);

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-5">
        <div className="text-xl font-semibold">Conversaciones</div>
        <div className="text-sm text-white/50 mt-1">
          Supervisa y toma control de cualquier conversación
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="rounded-[22px] bg-white/[0.05] border border-white/8 overflow-hidden">
          <div className="p-4 border-b border-white/8">
            <div className="font-semibold text-sm">Activas ({convs.length})</div>
          </div>
          <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {convs.length === 0 && (
              <div className="text-sm text-white/40 p-3 text-center">
                Sin conversaciones.
                <br />
                Abre el módulo huésped y chatea.
              </div>
            )}
            {convs.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full text-left rounded-2xl p-3 border transition ${
                  c.id === active
                    ? "bg-white/10 border-white/20"
                    : "bg-black/20 border-white/8 hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-mono">…{c.id.slice(-6)}</div>
                  <div className="flex gap-1">
                    {c.humanTakeover && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20">
                        STAFF
                      </span>
                    )}
                    {c.aiEnabled && !c.humanTakeover && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                        IA
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {new Date(c.lastMessageAt).toLocaleTimeString("es-MX")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="lg:col-span-2">
          {current && user ? (
            <ChatPanel
              conversationId={current.id}
              hotelId={user.hotelId}
              guestId={current.guestId}
              allowTakeoverControls
            />
          ) : (
            <div className="rounded-[22px] bg-white/[0.04] border border-white/8 h-full min-h-[300px] flex flex-col items-center justify-center text-white/40 gap-2">
              <div className="text-4xl">💬</div>
              <div className="text-sm">Selecciona una conversación</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
