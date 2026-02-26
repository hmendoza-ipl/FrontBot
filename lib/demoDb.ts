// lib/demoDb.ts
// Concierge IA — conversaciones, tickets, áreas → Prisma (PostgreSQL)

import { prisma } from "./prisma";

// ─── Types (compatibles con el resto del código) ─────────────────────────────

export type Area = { id: string; name: string; slaMinutes: number; email?: string | null };
export type TicketStatus   = "new" | "assigned" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Ticket = {
  id: string; hotelId: string; guestId: string; areaId: string;
  title: string; description?: string | null;
  status: TicketStatus; priority: TicketPriority;
  createdAt: string; dueAt: string;
};

export type Conversation = {
  id: string; hotelId: string; guestId: string;
  aiEnabled: boolean; humanTakeover: boolean; lastMessageAt: string;
};

export type MessageSender = "guest" | "ai" | "human";
export type Message = {
  id: string; conversationId: string;
  sender: MessageSender; content: string; createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISO(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

function mapTicket(t: any): Ticket {
  return {
    id: t.id, hotelId: t.hotelId, guestId: t.guestId, areaId: t.areaId,
    title: t.title, description: t.description,
    status: t.status as TicketStatus, priority: t.priority as TicketPriority,
    createdAt: toISO(t.createdAt), dueAt: toISO(t.dueAt),
  };
}

// ─── Areas ───────────────────────────────────────────────────────────────────

export async function listAreas(): Promise<Area[]> {
  return prisma.area.findMany({ orderBy: { name: "asc" } });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getOrCreateConversation(hotelId: string, guestId: string): Promise<Conversation> {
  const c = await prisma.conversation.upsert({
    where:  { hotelId_guestId: { hotelId, guestId } },
    update: {},
    create: { hotelId, guestId, aiEnabled: true, humanTakeover: false },
  });
  return { ...c, lastMessageAt: toISO(c.lastMessageAt) };
}

export async function listConversations(hotelId: string): Promise<Conversation[]> {
  const rows = await prisma.conversation.findMany({
    where:   { hotelId },
    orderBy: { lastMessageAt: "desc" },
  });
  return rows.map(c => ({ ...c, lastMessageAt: toISO(c.lastMessageAt) }));
}

export async function setTakeover(conversationId: string, humanTakeover: boolean) {
  await prisma.conversation.update({ where: { id: conversationId }, data: { humanTakeover } });
}

export async function setAiEnabled(conversationId: string, aiEnabled: boolean) {
  await prisma.conversation.update({ where: { id: conversationId }, data: { aiEnabled } });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function listMessages(conversationId: string): Promise<Message[]> {
  const rows = await prisma.message.findMany({
    where:   { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(m => ({ ...m, sender: m.sender as MessageSender, createdAt: toISO(m.createdAt) }));
}

export async function addMessage(conversationId: string, sender: MessageSender, content: string): Promise<Message> {
  const [m] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId, sender: sender as any, content } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
  ]);
  return { ...m, sender: m.sender as MessageSender, createdAt: toISO(m.createdAt) };
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export async function listTickets(hotelId: string): Promise<Ticket[]> {
  const rows = await prisma.ticket.findMany({
    where:   { hotelId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapTicket);
}

export async function createTicket(input: Omit<Ticket, "id" | "createdAt" | "dueAt">): Promise<Ticket> {
  const area = await prisma.area.findUnique({ where: { id: input.areaId } });
  const sla  = area?.slaMinutes ?? 30;
  const dueAt = new Date(Date.now() + sla * 60000);

  const t = await prisma.ticket.create({
    data: { ...input, status: input.status as any, priority: input.priority as any, dueAt },
  });
  return mapTicket(t);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<Ticket | null> {
  try {
    const t = await prisma.ticket.update({ where: { id: ticketId }, data: { status: status as any } });
    return mapTicket(t);
  } catch { return null; }
}
