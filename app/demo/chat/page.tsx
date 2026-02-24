"use client";

import { useEffect, useState } from "react";
import { getDemoUser } from "@/lib/demoAuth";
import { ChatPanel } from "@/components/ChatPanel";
import { useRouter } from "next/navigation";

export default function GuestChat() {
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const u = getDemoUser();
    if (!u) { router.push("/demo-login"); return; }
    setUser(u);

    (async () => {
      const r = await fetch("/api/demo/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: u.hotelId, guestId: u.id }),
      });
      const data = await r.json();
      setConversationId(data.conversation.id);
    })();
  }, []);

  if (!conversationId || !user)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-5">
        <div className="text-xl font-semibold">Chat con Frontbot IA</div>
        <div className="text-sm text-white/50 mt-1">
          Escribe tu solicitud y presiona "Respuesta IA" para obtener ayuda. El staff puede intervenir en cualquier momento.
        </div>
      </div>
      <ChatPanel
        conversationId={conversationId}
        hotelId={user.hotelId}
        guestId={user.id}
        allowAIButton
      />
    </div>
  );
}
