import { NextResponse } from "next/server";
import { listAreas } from "@/lib/demoDb";

export async function GET() {
  return NextResponse.json({ areas: listAreas() });
}
