// lib/hotelDb.ts
// Hotel PMS — capa de datos sobre Prisma (PostgreSQL)
// Misma API pública que la versión in-memory → las API routes no cambian.

import { prisma } from "./prisma";

// ─── Re-export types compatibles con las API routes ─────────────────────────

export type RoomStatus        = "available" | "occupied" | "maintenance" | "dirty" | "cleaning";
export type ReservationStatus = "booked" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export type PaymentMethod     = "transfer" | "card" | "cash";
export type FolioItemType     = "room" | "fb" | "minibar" | "laundry" | "spa" | "other";
export type InventoryMoveType = "in" | "out" | "waste";

export type RoomType    = { id: string; name: string; baseRate: number; capacity: number };
export type Room        = { id: string; number: string; typeId: string; floor?: string | null; status: RoomStatus; notes?: string | null };
export type Guest       = { id: string; fullName: string; email?: string | null; phone?: string | null; documentId?: string | null };
export type Reservation = {
  id: string; code: string; guestId: string; roomId?: string | null;
  status: ReservationStatus; checkIn: string; checkOut: string;
  adults: number; children: number; ratePerNight: number;
  createdAt: string; updatedAt: string; guestName?: string | null;
};
export type Payment   = { id: string; reservationId: string; amount: number; method: PaymentMethod; reference?: string | null; createdAt: string };
export type FolioItem = { id: string; reservationId: string; type: FolioItemType; description: string; qty: number; unitPrice: number; createdAt: string };
export type Vendor    = { id: string; name: string; email?: string | null; phone?: string | null };
export type FBItem    = { id: string; sku: string; name: string; unit: string; cost: number; stock: number; minStock: number };
export type InventoryMove = { id: string; itemId: string; type: InventoryMoveType; qty: number; reason: string; ref?: string | null; createdAt: string };
export type Purchase = {
  id: string; vendorId: string; status: "draft" | "ordered" | "received" | "cancelled";
  createdAt: string; receivedAt?: string | null;
  lines: Array<{ itemId: string; qty: number; unitCost: number }>;
};
export type Invoice = { id: string; reservationId: string; number: string; status: "draft" | "issued" | "void"; total: number; createdAt: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : d;
}

function mapRoom(r: any): Room {
  return { id: r.id, number: r.number, typeId: r.typeId, floor: r.floor, status: r.status as RoomStatus, notes: r.notes };
}
function mapReservation(r: any): Reservation {
  return {
    id: r.id, code: r.code, guestId: r.guestId, roomId: r.roomId,
    status: r.status as ReservationStatus,
    checkIn:  toISO(r.checkIn),
    checkOut: toISO(r.checkOut),
    adults: r.adults, children: r.children, ratePerNight: r.ratePerNight,
    guestName: r.guestName,
    createdAt: toISO(r.createdAt), updatedAt: toISO(r.updatedAt),
  };
}
function mapFolioItem(f: any): FolioItem {
  return { id: f.id, reservationId: f.reservationId, type: f.type as FolioItemType, description: f.description, qty: f.qty, unitPrice: f.unitPrice, createdAt: toISO(f.createdAt) };
}
function mapPayment(p: any): Payment {
  return { id: p.id, reservationId: p.reservationId, amount: p.amount, method: p.method as PaymentMethod, reference: p.reference, createdAt: toISO(p.createdAt) };
}
function mapPurchase(p: any): Purchase {
  return {
    id: p.id, vendorId: p.vendorId, status: p.status as Purchase["status"],
    createdAt: toISO(p.createdAt), receivedAt: p.receivedAt ? toISO(p.receivedAt) : null,
    lines: (p.lines || []).map((l: any) => ({ itemId: l.itemId, qty: l.qty, unitCost: l.unitCost })),
  };
}

// ─── Auto-assign room ────────────────────────────────────────────────────────

async function autoAssignRoom(res: {
  roomId?: string | null;
  checkIn: string; checkOut: string;
  adults: number; children: number;
}): Promise<string | undefined> {
  if (res.roomId) return res.roomId;
  const pax = (res.adults || 0) + (res.children || 0);

  const checkInDt  = new Date(res.checkIn);
  const checkOutDt = new Date(res.checkOut);

  const conflicting = await prisma.reservation.findMany({
    where: {
      status:   { in: ["booked", "checked_in"] },
      checkIn:  { lt: checkOutDt },
      checkOut: { gt: checkInDt },
      roomId:   { not: null },
    },
    select: { roomId: true },
  });
  const busyRoomIds = new Set(conflicting.map(r => r.roomId!));

  const candidates = await prisma.room.findMany({
    where: { status: "available", id: { notIn: Array.from(busyRoomIds) } },    include: { type: true },
    orderBy: { number: "asc" },
  });

  const suitable = candidates.filter(r => r.type.capacity >= pax);
  return (suitable[0] ?? candidates[0])?.id;
}

// ─── Rooms & Room Types ──────────────────────────────────────────────────────

export async function listRooms() {
  const [rooms, roomTypes] = await Promise.all([
    prisma.room.findMany({ orderBy: { number: "asc" } }),
    prisma.roomType.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    rooms:     rooms.map(mapRoom),
    roomTypes: roomTypes.map(rt => ({ id: rt.id, name: rt.name, baseRate: rt.baseRate, capacity: rt.capacity })),
  };
}

export async function updateRoom(id: string, patch: Partial<Room>) {
  try {
    const data: any = {};
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.notes  !== undefined) data.notes  = patch.notes;
    if (patch.floor  !== undefined) data.floor  = patch.floor;
    const r = await prisma.room.update({ where: { id }, data });
    return mapRoom(r);
  } catch { return null; }
}

export async function createRoom(input: Omit<Room, "id">) {
  const r = await prisma.room.create({
    data: { number: input.number, typeId: input.typeId, floor: input.floor, status: input.status as any, notes: input.notes },
  });
  return mapRoom(r);
}

export async function deleteRoom(id: string) {
  try { await prisma.room.delete({ where: { id } }); return true; }
  catch { return false; }
}

export async function createRoomType(input: Omit<RoomType, "id">) {
  const rt = await prisma.roomType.create({ data: input });
  return { id: rt.id, name: rt.name, baseRate: rt.baseRate, capacity: rt.capacity };
}

export async function updateRoomType(id: string, patch: Partial<RoomType>) {
  try {
    const rt = await prisma.roomType.update({ where: { id }, data: patch as any });
    return { id: rt.id, name: rt.name, baseRate: rt.baseRate, capacity: rt.capacity };
  } catch { return null; }
}

// ─── Reservations ────────────────────────────────────────────────────────────

export async function listReservations() {
  const rows = await prisma.reservation.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(mapReservation);
}

export async function getReservation(id: string) {
  const r = await prisma.reservation.findUnique({ where: { id } });
  return r ? mapReservation(r) : null;
}

export async function createReservation(input: Omit<Reservation, "id" | "createdAt" | "updatedAt" | "code">) {
  let roomId = input.roomId ?? undefined;
  if (input.status === "checked_in" && !roomId) {
    roomId = await autoAssignRoom({ ...input });
  }

  const r = await prisma.reservation.create({
    data: {
      code: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
      guestId: input.guestId, roomId: roomId ?? null,
      status:  input.status as any,
      checkIn:  new Date(input.checkIn),
      checkOut: new Date(input.checkOut),
      adults: input.adults, children: input.children,
      ratePerNight: input.ratePerNight, guestName: input.guestName,
    },
  });

  if (roomId && input.status === "checked_in") {
    await prisma.room.update({ where: { id: roomId }, data: { status: "occupied" } });
  }
  return mapReservation(r);
}

export async function patchReservation(id: string, patch: Partial<Reservation>) {
  const current = await getReservation(id);
  if (!current) return null;

  const data: any = {};
  if (patch.status       !== undefined) data.status       = patch.status;
  if (patch.roomId       !== undefined) data.roomId       = patch.roomId;
  if (patch.guestName    !== undefined) data.guestName    = patch.guestName;
  if (patch.ratePerNight !== undefined) data.ratePerNight = patch.ratePerNight;
  if (patch.checkIn      !== undefined) data.checkIn      = new Date(patch.checkIn);
  if (patch.checkOut     !== undefined) data.checkOut     = new Date(patch.checkOut);
  if (patch.adults       !== undefined) data.adults       = patch.adults;
  if (patch.children     !== undefined) data.children     = patch.children;

  // Auto-assign room on check-in
  if (patch.status === "checked_in" && !data.roomId && !current.roomId) {
    const assigned = await autoAssignRoom({
      checkIn:  patch.checkIn  ?? current.checkIn,
      checkOut: patch.checkOut ?? current.checkOut,
      adults:   patch.adults   ?? current.adults,
      children: patch.children ?? current.children,
    });
    if (assigned) data.roomId = assigned;
  }

  try {
    const r = await prisma.reservation.update({ where: { id }, data });

    if (patch.status === "checked_in" && r.roomId) {
      await prisma.room.update({ where: { id: r.roomId }, data: { status: "occupied" } });
    }
    if (patch.status === "checked_out" && r.roomId) {
      await prisma.room.update({ where: { id: r.roomId }, data: { status: "dirty" } });
    }
    return mapReservation(r);
  } catch { return null; }
}

// ─── Folio ───────────────────────────────────────────────────────────────────

export async function listFolio(reservationId: string) {
  const [items, payments] = await Promise.all([
    prisma.folioItem.findMany({ where: { reservationId }, orderBy: { createdAt: "asc" } }),
    prisma.payment.findMany({ where: { reservationId },   orderBy: { createdAt: "asc" } }),
  ]);
  const totalCharges = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalPaid    = payments.reduce((s, p) => s + p.amount, 0);
  return { items: items.map(mapFolioItem), payments: payments.map(mapPayment), totalCharges, totalPaid, balance: totalCharges - totalPaid };
}

export async function addFolioItem(input: Omit<FolioItem, "id" | "createdAt">) {
  const f = await prisma.folioItem.create({ data: { ...input, type: input.type as any } });
  return mapFolioItem(f);
}

export async function addPayment(input: Omit<Payment, "id" | "createdAt">) {
  const p = await prisma.payment.create({ data: { ...input, method: input.method as any } });
  return mapPayment(p);
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function listVendors() {
  return prisma.vendor.findMany({ orderBy: { name: "asc" } });
}

export async function createVendor(input: Omit<Vendor, "id">) {
  return prisma.vendor.create({ data: input });
}

// ─── F&B Items ───────────────────────────────────────────────────────────────

export async function listFBItems(): Promise<FBItem[]> {
  const rows = await prisma.fBItem.findMany({ orderBy: { name: "asc" } });
  return rows.map(r => ({ ...r, stock: Number(r.stock), minStock: Number(r.minStock), cost: Number(r.cost) }));
}

export async function createFBItem(input: Omit<FBItem, "id">) {
  return prisma.fBItem.create({ data: input });
}

// ─── Inventory Moves ─────────────────────────────────────────────────────────

export async function addInventoryMove(input: Omit<InventoryMove, "id" | "createdAt">) {
  const mv = await prisma.inventoryMove.create({ data: { ...input, type: input.type as any } });
  const delta = input.type === "in" ? input.qty : -Math.abs(input.qty);
  await prisma.fBItem.update({ where: { id: input.itemId }, data: { stock: { increment: delta } } });
  return { ...mv, type: mv.type as InventoryMoveType, createdAt: toISO(mv.createdAt) };
}

export async function listMoves(): Promise<InventoryMove[]> {
  const rows = await prisma.inventoryMove.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(m => ({ ...m, type: m.type as InventoryMoveType, createdAt: toISO(m.createdAt) }));
}

// ─── Purchases ───────────────────────────────────────────────────────────────

export async function listPurchases() {
  const rows = await prisma.purchase.findMany({ include: { lines: true }, orderBy: { createdAt: "desc" } });
  return rows.map(mapPurchase);
}

export async function createPurchase(input: Omit<Purchase, "id" | "createdAt" | "status">) {
  const p = await prisma.purchase.create({
    data: {
      vendorId: input.vendorId,
      lines: { create: input.lines.map(l => ({ itemId: l.itemId, qty: l.qty, unitCost: l.unitCost })) },
    },
    include: { lines: true },
  });
  return mapPurchase(p);
}

export async function receivePurchase(purchaseId: string) {
  const p = await prisma.purchase.findUnique({ where: { id: purchaseId }, include: { lines: true } });
  if (!p) return null;
  await prisma.purchase.update({ where: { id: purchaseId }, data: { status: "received", receivedAt: new Date() } });
  for (const line of p.lines) {
    await addInventoryMove({ itemId: line.itemId, type: "in", qty: line.qty, reason: "purchase", ref: purchaseId });
  }
  const updated = await prisma.purchase.findUnique({ where: { id: purchaseId }, include: { lines: true } });
  return updated ? mapPurchase(updated) : null;
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function listInvoices() {
  const rows = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(inv => ({ ...inv, status: inv.status as Invoice["status"], createdAt: toISO(inv.createdAt) }));
}

export async function createInvoiceFromReservation(reservationId: string) {
  const folio = await listFolio(reservationId);
  const inv = await prisma.invoice.create({
    data: {
      reservationId, number: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      status: "issued", total: folio.totalCharges,
    },
  });
  return { ...inv, status: inv.status as Invoice["status"], createdAt: toISO(inv.createdAt) };
}

export async function getInvoice(id: string) {
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return null;
  return { ...inv, status: inv.status as Invoice["status"], createdAt: toISO(inv.createdAt) };
}
