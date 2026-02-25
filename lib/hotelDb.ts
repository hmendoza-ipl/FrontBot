import { randomUUID } from "crypto";

const now = () => new Date().toISOString();
const addDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

export type RoomStatus = "available" | "occupied" | "maintenance" | "dirty" | "cleaning";
export type ReservationStatus = "booked" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export type PaymentMethod = "transfer" | "card" | "cash";
export type FolioItemType = "room" | "fb" | "minibar" | "laundry" | "spa" | "other";

export type RoomType = { id: string; name: string; baseRate: number; capacity: number };
export type Room = { id: string; number: string; typeId: string; floor?: string; status: RoomStatus; notes?: string };
export type Guest = { id: string; fullName: string; email?: string; phone?: string; documentId?: string };

export type Reservation = {
  id: string; code: string; guestId: string; roomId?: string;
  status: ReservationStatus; checkIn: string; checkOut: string;
  adults: number; children: number; ratePerNight: number;
  createdAt: string; updatedAt: string;
  guestName?: string;
};

export type Payment = { id: string; reservationId: string; amount: number; method: PaymentMethod; reference?: string; createdAt: string };
export type FolioItem = { id: string; reservationId: string; type: FolioItemType; description: string; qty: number; unitPrice: number; createdAt: string };

export type Vendor = { id: string; name: string; email?: string; phone?: string };
export type FBItem = { id: string; sku: string; name: string; unit: "pcs" | "kg" | "lt"; cost: number; stock: number; minStock: number };
export type InventoryMoveType = "in" | "out" | "waste";
export type InventoryMove = { id: string; itemId: string; type: InventoryMoveType; qty: number; reason: string; ref?: string; createdAt: string };
export type Purchase = { id: string; vendorId: string; status: "draft" | "ordered" | "received" | "cancelled"; createdAt: string; receivedAt?: string; lines: Array<{ itemId: string; qty: number; unitCost: number }> };
export type Invoice = { id: string; reservationId: string; number: string; status: "draft" | "issued" | "void"; total: number; createdAt: string };

const g = globalThis as any;
if (!g.__frontbot_hotel_demo) {
  const roomTypes: RoomType[] = [
    { id: "rt_std", name: "Standard", baseRate: 1200, capacity: 2 },
    { id: "rt_dlx", name: "Deluxe", baseRate: 1800, capacity: 3 },
    { id: "rt_ste", name: "Suite", baseRate: 3500, capacity: 4 },
  ];

  const rooms: Room[] = [
    { id: "r101", number: "101", typeId: "rt_std", floor: "1", status: "available" },
    { id: "r102", number: "102", typeId: "rt_std", floor: "1", status: "dirty" },
    { id: "r103", number: "103", typeId: "rt_std", floor: "1", status: "maintenance" },
    { id: "r201", number: "201", typeId: "rt_dlx", floor: "2", status: "available" },
    { id: "r202", number: "202", typeId: "rt_dlx", floor: "2", status: "occupied" },
    { id: "r301", number: "301", typeId: "rt_ste", floor: "3", status: "available" },
  ];

  const guests: Guest[] = [
    { id: "g1", fullName: "Carlos García", email: "carlos@demo.com", phone: "555-0001" },
    { id: "g2", fullName: "María López", email: "maria@demo.com", phone: "555-0002" },
  ];

  const reservations: Reservation[] = [
    {
      id: "res1", code: "FB-1001", guestId: "g1", roomId: "r202",
      status: "checked_in", checkIn: now(), checkOut: addDays(2),
      adults: 2, children: 0, ratePerNight: 1800,
      guestName: "Carlos García", createdAt: now(), updatedAt: now(),
    },
    {
      id: "res2", code: "FB-1002", guestId: "g2", roomId: "r201",
      status: "booked", checkIn: addDays(1), checkOut: addDays(4),
      adults: 2, children: 1, ratePerNight: 1800,
      guestName: "María López", createdAt: now(), updatedAt: now(),
    },
  ];

  const folio: FolioItem[] = [
    { id: "f1", reservationId: "res1", type: "room", description: "Noche habitación Deluxe", qty: 1, unitPrice: 1800, createdAt: now() },
    { id: "f2", reservationId: "res1", type: "minibar", description: "Agua mineral (2)", qty: 2, unitPrice: 45, createdAt: now() },
    { id: "f3", reservationId: "res1", type: "fb", description: "Desayuno buffet", qty: 2, unitPrice: 180, createdAt: now() },
  ];

  const payments: Payment[] = [
    { id: "p1", reservationId: "res1", amount: 1000, method: "transfer", reference: "TRX-2024-ABC", createdAt: now() },
  ];

  const vendors: Vendor[] = [
    { id: "v1", name: "Distribuidora Café SA", email: "ventas@cafe.com", phone: "555-1000" },
    { id: "v2", name: "Abarrotes Central", email: "ventas@abarrotes.com", phone: "555-2000" },
    { id: "v3", name: "Lácteos del Norte", email: "pedidos@lacteos.com", phone: "555-3000" },
  ];

  const fbItems: FBItem[] = [
    { id: "i1", sku: "CAF-001", name: "Café en grano", unit: "kg", cost: 220, stock: 12, minStock: 5 },
    { id: "i2", sku: "LEC-001", name: "Leche entera", unit: "lt", cost: 28, stock: 40, minStock: 15 },
    { id: "i3", sku: "AZU-001", name: "Azúcar", unit: "kg", cost: 35, stock: 18, minStock: 6 },
    { id: "i4", sku: "HAR-001", name: "Harina", unit: "kg", cost: 22, stock: 3, minStock: 8 },
    { id: "i5", sku: "ACA-001", name: "Aceite de oliva", unit: "lt", cost: 180, stock: 6, minStock: 4 },
  ];

  g.__frontbot_hotel_demo = {
    roomTypes, rooms, guests, reservations,
    folio, payments, vendors, fbItems,
    moves: [] as InventoryMove[],
    purchases: [] as Purchase[],
    invoices: [] as Invoice[],
  };
}

const db = g.__frontbot_hotel_demo as {
  roomTypes: RoomType[]; rooms: Room[]; guests: Guest[];
  reservations: Reservation[]; folio: FolioItem[]; payments: Payment[];
  vendors: Vendor[]; fbItems: FBItem[]; moves: InventoryMove[];
  purchases: Purchase[]; invoices: Invoice[];
};

// --- Helpers para auto-asignación de habitación ---

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function roomTypeById(typeId: string) {
  return db.roomTypes.find((t) => t.id === typeId) || null;
}

function isRoomAvailableForDates(roomId: string, checkIn: string, checkOut: string) {
  const active = db.reservations.filter(
    (r) => r.roomId === roomId && ["booked", "checked_in"].includes(r.status)
  );
  for (const r of active) {
    if (overlaps(checkIn, checkOut, r.checkIn, r.checkOut)) return false;
  }
  return true;
}

function autoAssignRoom(res: { roomId?: string; checkIn: string; checkOut: string; adults: number; children: number }) {
  if (res.roomId) return res.roomId;
  const pax = (res.adults || 0) + (res.children || 0);
  const candidates = db.rooms.filter((room) => room.status === "available");
  const good = candidates
    .map((room) => ({ room, rt: roomTypeById(room.typeId) }))
    .filter(({ rt }) => !rt || rt.capacity >= pax)
    .map(({ room }) => room);
  const finalList = (good.length ? good : candidates).filter((room) =>
    isRoomAvailableForDates(room.id, res.checkIn, res.checkOut)
  );
  return finalList[0]?.id || undefined;
}

export function listRooms() { return { rooms: db.rooms, roomTypes: db.roomTypes }; }
export function updateRoom(id: string, patch: Partial<Room>) {
  const r = db.rooms.find(x => x.id === id);
  if (!r) return null;
  Object.assign(r, patch);
  return r;
}

export function listReservations() {
  return db.reservations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getReservation(id: string) { return db.reservations.find(r => r.id === id) || null; }
export function createReservation(input: Omit<Reservation, "id" | "createdAt" | "updatedAt" | "code">) {
  const res: Reservation = {
    ...input, id: randomUUID(),
    code: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: now(), updatedAt: now(),
  };
  // Auto-assign habitación si entra checked_in sin roomId
  if (res.status === "checked_in" && !res.roomId) {
    res.roomId = autoAssignRoom(res);
  }
  db.reservations.push(res);
  if (res.roomId && res.status === "checked_in") {
    const room = db.rooms.find(r => r.id === res.roomId);
    if (room) room.status = "occupied";
  }
  return res;
}
export function patchReservation(id: string, patch: Partial<Reservation>) {
  const r = getReservation(id);
  if (!r) return null;
  Object.assign(r, patch);
  r.updatedAt = now();
  // Si se hace check-in y no hay habitación asignada, auto-asignar
  if (patch.status === "checked_in" && !r.roomId) {
    r.roomId = autoAssignRoom(r);
  }
  if (patch.status === "checked_in" && r.roomId) {
    const room = db.rooms.find(x => x.id === r.roomId);
    if (room) room.status = "occupied";
  }
  if (patch.status === "checked_out" && r.roomId) {
    const room = db.rooms.find(x => x.id === r.roomId);
    if (room) room.status = "dirty";
  }
  return r;
}

export function listFolio(reservationId: string) {
  const items = db.folio.filter(f => f.reservationId === reservationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const payments = db.payments.filter(p => p.reservationId === reservationId);
  const totalCharges = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  return { items, payments, totalCharges, totalPaid, balance: totalCharges - totalPaid };
}
export function addFolioItem(input: Omit<FolioItem, "id" | "createdAt">) {
  const item: FolioItem = { ...input, id: randomUUID(), createdAt: now() };
  db.folio.push(item);
  return item;
}
export function addPayment(input: Omit<Payment, "id" | "createdAt">) {
  const p: Payment = { ...input, id: randomUUID(), createdAt: now() };
  db.payments.push(p);
  return p;
}

export function listVendors() { return db.vendors; }
export function createVendor(input: Omit<Vendor, "id">) {
  const v: Vendor = { ...input, id: randomUUID() };
  db.vendors.push(v);
  return v;
}

export function listFBItems() { return db.fbItems; }
export function createFBItem(input: Omit<FBItem, "id">) {
  const it: FBItem = { ...input, id: randomUUID() };
  db.fbItems.push(it);
  return it;
}

export function addInventoryMove(input: Omit<InventoryMove, "id" | "createdAt">) {
  const mv: InventoryMove = { ...input, id: randomUUID(), createdAt: now() };
  db.moves.push(mv);
  const item = db.fbItems.find(i => i.id === input.itemId);
  if (item) {
    if (input.type === "in") item.stock += input.qty;
    if (input.type === "out" || input.type === "waste") item.stock = Math.max(0, item.stock - input.qty);
  }
  return mv;
}
export function listMoves() { return db.moves.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }

export function listPurchases() { return db.purchases.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function createPurchase(input: Omit<Purchase, "id" | "createdAt" | "status">) {
  const p: Purchase = { ...input, id: randomUUID(), createdAt: now(), status: "draft" };
  db.purchases.push(p);
  return p;
}
export function receivePurchase(purchaseId: string) {
  const p = db.purchases.find(x => x.id === purchaseId);
  if (!p) return null;
  p.status = "received";
  p.receivedAt = now();
  for (const line of p.lines) {
    addInventoryMove({ itemId: line.itemId, type: "in", qty: line.qty, reason: "purchase", ref: purchaseId });
  }
  return p;
}

export function listInvoices() { return db.invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function createInvoiceFromReservation(reservationId: string) {
  const folio = listFolio(reservationId);
  const inv: Invoice = {
    id: randomUUID(), reservationId,
    number: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
    status: "issued", total: folio.totalCharges, createdAt: now(),
  };
  db.invoices.push(inv);
  return inv;
}
export function getInvoice(id: string) { return db.invoices.find(x => x.id === id) || null; }

// --- Rooms & Room Types CRUD ---

export function createRoomType(input: Omit<RoomType, "id">) {
  const rt: RoomType = { ...input, id: randomUUID() };
  db.roomTypes.push(rt);
  return rt;
}

export function updateRoomType(id: string, patch: Partial<RoomType>) {
  const rt = db.roomTypes.find((x) => x.id === id);
  if (!rt) return null;
  Object.assign(rt, patch);
  return rt;
}

export function createRoom(input: Omit<Room, "id">) {
  const room: Room = { ...input, id: randomUUID() };
  db.rooms.push(room);
  return room;
}

export function deleteRoom(id: string) {
  const idx = db.rooms.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  db.rooms.splice(idx, 1);
  return true;
}
