import { NextResponse } from "next/server";
import { listReservations, listRooms, listFolio, listFBItems, listPurchases } from "@/lib/hotelDb";

export async function GET() {
  const [reservations, { rooms }, fbItems, purchases] = await Promise.all([
    listReservations(),
    listRooms(),
    listFBItems(),
    listPurchases(),
  ]);

  const byStatus: Record<string, number> = {};
  for (const r of reservations) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  const occupiedNow = rooms.filter(r => r.status === "occupied").length;
  const totalRooms  = rooms.length;
  const occRate     = totalRooms ? occupiedNow / totalRooms : 0;

  const activeRes = reservations.filter(r => r.status === "checked_in");
  const adr    = activeRes.length ? activeRes.reduce((s, r) => s + r.ratePerNight, 0) / activeRes.length : 0;
  const revpar = adr * occRate;

  let revenuePaid = 0, chargesTotal = 0, balanceTotal = 0;
  const chargesByType: Record<string, number> = {};

  for (const r of reservations) {
    const f = await listFolio(r.id);
    revenuePaid  += f.totalPaid;
    chargesTotal += f.totalCharges;
    balanceTotal += f.balance;
    for (const item of f.items) {
      chargesByType[item.type] = (chargesByType[item.type] || 0) + item.qty * item.unitPrice;
    }
  }

  const inventoryValue  = fbItems.reduce((s, i) => s + i.stock * i.cost, 0);
  const lowStockCount   = fbItems.filter(i => i.stock <= i.minStock).length;
  const purchasesReceived = purchases.filter(p => p.status === "received");
  const expensesPurchases = purchasesReceived.reduce((s, p) =>
    s + p.lines.reduce((x, l) => x + l.qty * l.unitCost, 0), 0);
  const grossProfit = revenuePaid - expensesPurchases;

  const roomsByStatus: Record<string, number> = {};
  for (const r of rooms) roomsByStatus[r.status] = (roomsByStatus[r.status] || 0) + 1;

  return NextResponse.json({
    kpis: { revenuePaid, chargesTotal, balanceTotal, expensesPurchases, grossProfit, inventoryValue, lowStockCount, occRate, occupiedNow, totalRooms, adr, revpar },
    byStatus, chargesByType, roomsByStatus,
    top: {
      reservations: reservations.slice(0, 10),
      lowStock: fbItems.filter(i => i.stock <= i.minStock).slice(0, 10),
      purchasesReceived: purchasesReceived.slice(0, 10),
    },
  });
}
