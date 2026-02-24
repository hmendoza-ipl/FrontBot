import { NextResponse } from "next/server";
import { addMessage, listMessages, setAiEnabled, setTakeover } from "@/lib/demoDb";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId)
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  return NextResponse.json({ messages: listMessages(conversationId) });
}

export async function POST(req: Request) {
  const { conversationId, sender, content } = await req.json();
  if (!conversationId || !sender || !content)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const msg = addMessage(conversationId, sender, content);
  return NextResponse.json({ message: msg });
}

export async function PATCH(req: Request) {
  const { conversationId, humanTakeover, aiEnabled } = await req.json();
  if (!conversationId)
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  if (typeof humanTakeover === "boolean") setTakeover(conversationId, humanTakeover);
  if (typeof aiEnabled === "boolean") setAiEnabled(conversationId, aiEnabled);
  return NextResponse.json({ ok: true });
}
