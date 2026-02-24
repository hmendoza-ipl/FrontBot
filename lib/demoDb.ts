import { randomUUID } from "crypto";

export type Area = { id: string; name: string; slaMinutes: number; email?: string };
export type TicketStatus = "new" | "assigned" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Ticket = {
  id: string;
  hotelId: string;
  guestId: string;
  areaId: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  dueAt: string;
};

export type Conversation = {
  id: string;
  hotelId: string;
  guestId: string;
  aiEnabled: boolean;
  humanTakeover: boolean;
  lastMessageAt: string;
};

export type MessageSender = "guest" | "ai" | "human";
export type Message = {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
};

const now = () => new Date().toISOString();
const addMinutes = (m: number) => new Date(Date.now() + m * 60000).toISOString();

// Runtime persistence (server memory)
const g = globalThis as any;
if (!g.__frontbot_demo_db) {
  g.__frontbot_demo_db = {
    areas: [
      { id: "a_housekeeping", name: "Housekeeping", slaMinutes: 20, email: "housekeeping@hotel.com" },
      { id: "a_roomservice", name: "Room Service", slaMinutes: 30, email: "roomservice@hotel.com" },
      { id: "a_maintenance", name: "Maintenance", slaMinutes: 45, email: "maintenance@hotel.com" },
      { id: "a_frontdesk", name: "Front Desk", slaMinutes: 15, email: "frontdesk@hotel.com" },
      { id: "a_concierge", name: "Concierge", slaMinutes: 60, email: "concierge@hotel.com" },
      { id: "a_security", name: "Security", slaMinutes: 10, email: "security@hotel.com" },
    ] as Area[],
    tickets: [] as Ticket[],
    conversations: [] as Conversation[],
    messages: [] as Message[],
  };
}

const db = g.__frontbot_demo_db as {
  areas: Area[];
  tickets: Ticket[];
  conversations: Conversation[];
  messages: Message[];
};

export function listAreas() {
  return db.areas;
}

export function getOrCreateConversation(hotelId: string, guestId: string) {
  let c = db.conversations.find((x) => x.hotelId === hotelId && x.guestId === guestId);
  if (!c) {
    c = {
      id: randomUUID(),
      hotelId,
      guestId,
      aiEnabled: true,
      humanTakeover: false,
      lastMessageAt: now(),
    };
    db.conversations.push(c);
  }
  return c;
}

export function listConversations(hotelId: string) {
  return db.conversations
    .filter((c) => c.hotelId === hotelId)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function setTakeover(conversationId: string, humanTakeover: boolean) {
  const c = db.conversations.find((x) => x.id === conversationId);
  if (c) c.humanTakeover = humanTakeover;
}

export function setAiEnabled(conversationId: string, aiEnabled: boolean) {
  const c = db.conversations.find((x) => x.id === conversationId);
  if (c) c.aiEnabled = aiEnabled;
}

export function listMessages(conversationId: string) {
  return db.messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addMessage(conversationId: string, sender: MessageSender, content: string) {
  const m: Message = { id: randomUUID(), conversationId, sender, content, createdAt: now() };
  db.messages.push(m);
  const c = db.conversations.find((x) => x.id === conversationId);
  if (c) c.lastMessageAt = m.createdAt;
  return m;
}

export function listTickets(hotelId: string) {
  return db.tickets
    .filter((t) => t.hotelId === hotelId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createTicket(input: Omit<Ticket, "id" | "createdAt" | "dueAt">) {
  const area = db.areas.find((a) => a.id === input.areaId);
  const t: Ticket = {
    ...input,
    id: randomUUID(),
    createdAt: now(),
    dueAt: addMinutes(area?.slaMinutes ?? 30),
  };
  db.tickets.push(t);
  return t;
}

export function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const t = db.tickets.find((x) => x.id === ticketId);
  if (t) t.status = status;
  return t;
}
