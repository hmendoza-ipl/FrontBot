// prisma/seed.ts
// Carga datos demo en PostgreSQL.
// Ejecutar: npx prisma db seed
// O automáticamente si SEED_ON_BOOT=true en Coolify.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Frontbot Hotel — Seeding demo data…");

  // Idempotente: solo inserta si la tabla está vacía
  const existingRoomTypes = await prisma.roomType.count();
  if (existingRoomTypes > 0) {
    console.log("✓ DB ya tiene datos, skip seed.");
    return;
  }

  // ─── Room Types ──────────────────────────────────────────────
  const [rtStd, rtDlx, rtSte] = await Promise.all([
    prisma.roomType.create({ data: { name: "Standard", baseRate: 1200, capacity: 2 } }),
    prisma.roomType.create({ data: { name: "Deluxe",   baseRate: 1800, capacity: 3 } }),
    prisma.roomType.create({ data: { name: "Suite",    baseRate: 3500, capacity: 4 } }),
  ]);
  console.log("✓ Room types");

  // ─── Rooms ───────────────────────────────────────────────────
  const [r101, r102, r103, r201, r202, r301] = await Promise.all([
    prisma.room.create({ data: { number: "101", typeId: rtStd.id, floor: "1", status: "available" } }),
    prisma.room.create({ data: { number: "102", typeId: rtStd.id, floor: "1", status: "dirty" } }),
    prisma.room.create({ data: { number: "103", typeId: rtStd.id, floor: "1", status: "maintenance" } }),
    prisma.room.create({ data: { number: "201", typeId: rtDlx.id, floor: "2", status: "available" } }),
    prisma.room.create({ data: { number: "202", typeId: rtDlx.id, floor: "2", status: "occupied" } }),
    prisma.room.create({ data: { number: "301", typeId: rtSte.id, floor: "3", status: "available" } }),
  ]);
  console.log("✓ Rooms");

  // ─── Guests ──────────────────────────────────────────────────
  const [g1, g2] = await Promise.all([
    prisma.guest.create({ data: { fullName: "Carlos García", email: "carlos@demo.com", phone: "555-0001" } }),
    prisma.guest.create({ data: { fullName: "María López",  email: "maria@demo.com",  phone: "555-0002" } }),
  ]);
  console.log("✓ Guests");

  // ─── Reservations ────────────────────────────────────────────
  const now      = new Date();
  const addDays  = (d: number) => new Date(Date.now() + d * 86400000);

  const res1 = await prisma.reservation.create({
    data: {
      code: "FB-1001", guestId: g1.id, roomId: r202.id,
      status: "checked_in",
      checkIn:  now,
      checkOut: addDays(2),
      adults: 2, children: 0, ratePerNight: 1800,
      guestName: "Carlos García",
    },
  });

  const res2 = await prisma.reservation.create({
    data: {
      code: "FB-1002", guestId: g2.id, roomId: r201.id,
      status: "booked",
      checkIn:  addDays(1),
      checkOut: addDays(4),
      adults: 2, children: 1, ratePerNight: 1800,
      guestName: "María López",
    },
  });
  console.log("✓ Reservations");

  // ─── Folio items ─────────────────────────────────────────────
  await prisma.folioItem.createMany({
    data: [
      { reservationId: res1.id, type: "room",    description: "Noche habitación Deluxe", qty: 1, unitPrice: 1800 },
      { reservationId: res1.id, type: "minibar",  description: "Agua mineral (2)",        qty: 2, unitPrice: 45   },
      { reservationId: res1.id, type: "fb",       description: "Desayuno buffet",         qty: 2, unitPrice: 180  },
    ],
  });

  // ─── Payment ─────────────────────────────────────────────────
  await prisma.payment.create({
    data: { reservationId: res1.id, amount: 1000, method: "transfer", reference: "TRX-2024-ABC" },
  });
  console.log("✓ Folio & payments");

  // ─── Vendors ─────────────────────────────────────────────────
  const [v1, v2] = await Promise.all([
    prisma.vendor.create({ data: { name: "Distribuidora Café SA", email: "ventas@cafe.com",      phone: "555-1000" } }),
    prisma.vendor.create({ data: { name: "Abarrotes Central",     email: "ventas@abarrotes.com", phone: "555-2000" } }),
    prisma.vendor.create({ data: { name: "Lácteos del Norte",     email: "pedidos@lacteos.com",  phone: "555-3000" } }),
  ]);
  console.log("✓ Vendors");

  // ─── F&B Items ───────────────────────────────────────────────
  const [i1, i2, i3, i4] = await Promise.all([
    prisma.fBItem.create({ data: { sku: "CAF-001", name: "Café en grano",  unit: "kg",  cost: 220, stock: 12, minStock: 5  } }),
    prisma.fBItem.create({ data: { sku: "LEC-001", name: "Leche entera",   unit: "lt",  cost: 28,  stock: 40, minStock: 15 } }),
    prisma.fBItem.create({ data: { sku: "AZU-001", name: "Azúcar",         unit: "kg",  cost: 35,  stock: 18, minStock: 6  } }),
    prisma.fBItem.create({ data: { sku: "HAR-001", name: "Harina",         unit: "kg",  cost: 22,  stock: 3,  minStock: 8  } }),
    prisma.fBItem.create({ data: { sku: "ACA-001", name: "Aceite de oliva",unit: "lt",  cost: 180, stock: 6,  minStock: 4  } }),
  ]);
  console.log("✓ F&B items");

  // ─── Concierge IA: Areas ─────────────────────────────────────
  await prisma.area.createMany({
    data: [
      { name: "Housekeeping", slaMinutes: 20, email: "housekeeping@hotel.com" },
      { name: "Room Service", slaMinutes: 30, email: "roomservice@hotel.com"  },
      { name: "Maintenance",  slaMinutes: 45, email: "maintenance@hotel.com"  },
      { name: "Front Desk",   slaMinutes: 15, email: "frontdesk@hotel.com"    },
      { name: "Concierge",    slaMinutes: 60, email: "concierge@hotel.com"    },
      { name: "Security",     slaMinutes: 10, email: "security@hotel.com"     },
    ],
  });
  console.log("✓ Areas");

  console.log("\n✅ Seed completo. DB lista para demo.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
