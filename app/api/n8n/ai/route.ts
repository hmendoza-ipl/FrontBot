import { NextResponse } from "next/server";
import { listMessages, addMessage } from "@/lib/demoDb";

const fallbackResponses = [
  "Entendido. He creado un ticket para el equipo correspondiente. Te avisaremos cuando esté en camino. ¿Algo más en lo que pueda ayudarte?",
  "¡Claro! He registrado tu solicitud. El equipo de servicio estará contigo en breve. 😊",
  "Perfecto, ya queda anotado. ¿Necesitas algo más durante tu estancia?",
  "He notificado al área responsable. Normalmente el tiempo de respuesta es de 15-30 minutos. ¿Puedo ayudarte con algo más?",
  "Tu solicitud ha sido recibida y priorizada. Mientras tanto, ¿hay algo adicional que pueda hacer por ti?",
];

export async function POST(req: Request) {
  const { conversationId, hotelId, guestId } = await req.json();
  const webhook = process.env.N8N_AI_WEBHOOK_URL;

  if (!webhook) {
    const random = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    await addMessage(conversationId, "ai", random);
    return NextResponse.json({ ok: true, mode: "fallback" });
  }

  const messages = (await listMessages(conversationId)).slice(-30);
  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelId, guestId, conversationId, messages }),
    });
    const data = await r.json().catch(() => ({}));
    if (data?.reply) await addMessage(conversationId, "ai", data.reply);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    await addMessage(conversationId, "ai", "Lo siento, el asistente está temporalmente no disponible. Por favor contacta al front desk.");
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
