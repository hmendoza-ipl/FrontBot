import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to, subject, html } = await req.json();
  const provider = process.env.MAIL_PROVIDER || "resend";

  if (provider !== "resend")
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!key || !from)
    return NextResponse.json({ error: "Mail env missing (RESEND_API_KEY, MAIL_FROM)" }, { status: 500 });

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!r.ok)
    return NextResponse.json({ error: "Resend error", detail: await r.text() }, { status: 500 });

  return NextResponse.json({ ok: true });
}
