import { NextResponse } from "next/server";
import {
  listReservations,
  listRooms,
  listFolio,
  listFBItems,
  listPurchases,
} from "@/lib/hotelDb";

export async function GET() {
  const reservations = listReservations();
  const { rooms } = listRooms();

  let revenuePaid = 0;
  let chargesTotal = 0;
  let balanceTotal = 0;

  const byStatus: Record<string, number> = {};
  for (const r of reservations) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  const occupiedNow = rooms.filter((r: any) => r.status === "occupied").length;
  const totalRooms = rooms.length;
  const occRate = totalRooms ? occupiedNow / totalRooms : 0;

  // ADR (Average Daily Rate): avg ratePerNight de reservas checked_in
  const activeRes = reservations.filter(r => r.status === "checked_in");
  const adr = activeRes.length
    ? activeRes.reduce((s, r) => s + r.ratePerNight, 0) / activeRes.length
    : 0;
  // RevPAR = ADR * occRate
  const revpar = adr * occRate;

  for (const r of reservations) {
    const f = listFolio(r.id);
    revenuePaid += f.totalPaid;
    chargesTotal += f.totalCharges;
    balanceTotal += f.balance;
  }

  const fbItems = listFBItems();
  const inventoryValue = fbItems.reduce((s: number, i: any) => s + (i.stock || 0) * (i.cost || 0), 0);
  const lowStockCount = fbItems.filter((i: any) => i.stock <= i.minStock).length;

  const purchases = listPurchases();
  const purchasesReceived = purchases.filter((p: any) => p.status === "received");
  const expensesPurchases = purchasesReceived.reduce((s: number, p: any) => {
    return s + (p.lines || []).reduce((x: number, l: any) => x + (l.qty || 0) * (l.unitCost || 0), 0);
  }, 0);

  const grossProfit = revenuePaid - expensesPurchases;

  // Consumos por categoría (folio items)
  const chargesByType: Record<string, number> = {};
  for (const r of reservations) {
    const f = listFolio(r.id);
    for (const item of f.items) {
      chargesByType[item.type] = (chargesByType[item.type] || 0) + item.qty * item.unitPrice;
    }
  }

  // Housekeeping: rooms por estado
  const roomsByStatus: Record<string, number> = {};
  for (const r of rooms) roomsByStatus[r.status] = (roomsByStatus[r.status] || 0) + 1;

  return NextResponse.json({
    kpis: {
      revenuePaid, chargesTotal, balanceTotal,
      expensesPurchases, grossProfit,
      inventoryValue, lowStockCount,
      occRate, occupiedNow, totalRooms,
      adr, revpar,
    },
    byStatus,
    chargesByType,
    roomsByStatus,
    top: {
      reservations: reservations.slice(0, 10),
      lowStock: fbItems.filter((i: any) => i.stock <= i.minStock).slice(0, 10),
      purchasesReceived: purchasesReceived.slice(0, 10),
    },
  });
}
