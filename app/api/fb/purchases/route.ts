import { NextResponse } from "next/server";
import { listPurchases, createPurchase, receivePurchase } from "@/lib/hotelDb";

export async function GET() {
  return NextResponse.json({ purchases: listPurchases() });
}
export async function POST(req: Request) {
  const purchase = createPurchase(await req.json());
  return NextResponse.json({ purchase });
}
export async function PATCH(req: Request) {
  const { purchaseId, action } = await req.json();
  if (action === "receive") {
    const p = receivePurchase(purchaseId);
    if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ purchase: p });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
