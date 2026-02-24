"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  sender: "guest" | "ai" | "human";
  content: string;
  createdAt: string;
};

export function ChatPanel({
  conversationId,
  hotelId,
  guestId,
  allowAIButton,
  allowTakeoverControls,
}: {
  conversationId: string;
  hotelId: string;
  guestId: string;
  allowAIButton?: boolean;
  allowTakeoverControls?: boolean;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [takeover, setTakeover] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch(`/api/demo/messages?conversationId=${conversationId}`);
    const data = await r.json();
    setMsgs(data.messages || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 1200);
    return () => clearInterval(t);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(sender: "guest" | "human") {
    if (!text.trim()) return;
    const content = text;
    setText("");
    await fetch("/api/demo/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, sender, content }),
    });
    await load();
  }

  async function askAI() {
    setLoading(true);
    await fetch("/api/n8n/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, hotelId, guestId }),
    });
    await load();
    setLoading(false);
  }

  async function toggleTakeover() {
    const next = !takeover;
    setTakeover(next);
    const nextAI = next ? false : true;
    setAiEnabled(nextAI);
    await fetch("/api/demo/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, humanTakeover: next, aiEnabled: nextAI }),
    });
  }

  async function toggleAI() {
    const next = !aiEnabled;
    setAiEnabled(next);
    await fetch("/api/demo/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, aiEnabled: next }),
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(allowTakeoverControls ? "human" : "guest");
    }
  }

  const senderConfig = {
    guest: { label: "HUÉSPED", bg: "bg-white text-black", align: "items-end", labelColor: "text-black/50" },
    ai: {
      label: "FRONTBOT IA",
      bg: "bg-cyan-500/15 border border-cyan-500/20 text-white",
      align: "items-start",
      labelColor: "text-cyan-400/70",
    },
    human: {
      label: "STAFF",
      bg: "bg-indigo-500/15 border border-indigo-400/20 text-white",
      align: "items-start",
      labelColor: "text-indigo-400/70",
    },
  };

  return (
    <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Conversación en tiempo real
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            {allowTakeoverControls ? "Vista admin · Modo intervención disponible" : "Chat con IA · Respuesta ~2 segundos"}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {allowAIButton && (
            <button
              onClick={askAI}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Pensando…
                </>
              ) : (
                <>🤖 Respuesta IA</>
              )}
            </button>
          )}
          {allowTakeoverControls && (
            <>
              <button
                onClick={toggleAI}
                className={`px-3 py-2 rounded-xl text-xs border font-mono transition ${
                  aiEnabled
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-black/20 border-white/10 text-white/50"
                }`}
              >
                IA {aiEnabled ? "ON" : "OFF"}
              </button>
              <button
                onClick={toggleTakeover}
                className={`px-3 py-2 rounded-xl text-xs border font-semibold transition ${
                  takeover
                    ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                    : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                }`}
              >
                {takeover ? "🔴 Liberar" : "⚡ Intervenir"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Takeover banner */}
      {takeover && (
        <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 text-xs text-orange-300 font-mono flex items-center gap-2">
          <span>⚡</span> Modo intervención activo · Tú estás respondiendo como staff
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 h-[400px] overflow-y-auto p-4 space-y-3 bg-black/20">
        {msgs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm">
            <div className="text-3xl mb-2">💬</div>
            <div>Sin mensajes aún.</div>
            <div className="text-xs mt-1">
              {allowAIButton ? "Escribe algo y haz click en 'Respuesta IA'" : "Inicia la conversación"}
            </div>
          </div>
        )}
        {msgs.map((m) => {
          const cfg = senderConfig[m.sender];
          return (
            <div key={m.id} className={`flex flex-col ${cfg.align} gap-0.5`}>
              <div className={`text-[10px] font-mono px-1 ${cfg.labelColor}`}>{cfg.label}</div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${cfg.bg} ${
                  m.sender === "guest" ? "rounded-tr-sm" : "rounded-tl-sm"
                }`}
              >
                {m.content}
              </div>
              <div className="text-[9px] text-white/20 px-1">
                {new Date(m.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/8 flex gap-2">
        <input
          className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none text-sm focus:border-cyan-500/40 transition placeholder:text-white/30"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={allowTakeoverControls && takeover ? "Escribe como staff…" : "Escribe tu mensaje…"}
        />
        <button
          onClick={() => send(allowTakeoverControls ? "human" : "guest")}
          disabled={!text.trim()}
          className="px-4 rounded-xl bg-white text-black font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition"
        >
          →
        </button>
      </div>
    </div>
  );
}
