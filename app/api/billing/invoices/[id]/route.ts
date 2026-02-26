import { NextResponse } from "next/server";
import { getInvoice, listFolio, getReservation } from "@/lib/hotelDb";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const inv = await getInvoice(params.id);
  if (!inv) return new NextResponse("Not found", { status: 404 });

  const [folio, res] = await Promise.all([
    listFolio(inv.reservationId),
    getReservation(inv.reservationId),
  ]);
  const subtotal = folio.totalCharges / 1.16;
  const iva = folio.totalCharges - subtotal;

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${inv.number} — Frontbot</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',system-ui,sans-serif; background:#f8fafc; color:#1e293b; padding:32px; }
    .card { background:#fff; border-radius:16px; padding:32px; max-width:560px; margin:0 auto; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { text-align:center; margin-bottom:24px; padding-bottom:20px; border-bottom:2px solid #f1f5f9; }
    .logo { font-size:22px; font-weight:800; background:linear-gradient(135deg,#38BDF8,#6366F1); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .badge { display:inline-block; margin-top:8px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; background:#dcfce7; color:#16a34a; }
    .meta { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    .meta-item { padding:10px 12px; background:#f8fafc; border-radius:10px; }
    .meta-label { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; margin-bottom:2px; }
    .meta-value { font-size:13px; font-weight:600; color:#1e293b; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; font-size:13px; }
    th { text-align:left; padding:8px 4px; color:#94a3b8; font-size:10px; text-transform:uppercase; border-bottom:1px solid #f1f5f9; }
    td { padding:9px 4px; border-bottom:1px solid #f8fafc; }
    td:last-child { text-align:right; font-weight:600; }
    .totals { padding-top:12px; border-top:2px solid #f1f5f9; }
    .row { display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px; color:#64748b; }
    .row-total { display:flex; justify-content:space-between; margin-top:8px; font-size:18px; font-weight:800; color:#1e293b; }
    .paid-row { display:flex; justify-content:space-between; margin-top:4px; font-size:13px; color:#22c55e; font-weight:600; }
    .balance-row { display:flex; justify-content:space-between; margin-top:4px; font-size:14px; font-weight:700; color:#ef4444; }
    .footer { text-align:center; margin-top:24px; font-size:11px; color:#94a3b8; line-height:1.6; }
    .type-badge { display:inline-block; padding:2px 7px; border-radius:99px; font-size:10px; font-weight:600; }
    .type-room { background:#eff6ff; color:#3b82f6; } .type-fb { background:#fef9c3; color:#ca8a04; }
    .type-minibar { background:#fdf2f8; color:#a21caf; } .type-spa { background:#f0fdf4; color:#16a34a; }
    .type-laundry { background:#f0f9ff; color:#0369a1; } .type-other { background:#f8fafc; color:#64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">Frontbot Hotel</div>
      <div style="font-size:13px;color:#64748b;margin-top:4px">Powered by Qubica.AI</div>
      <div class="badge">✓ FACTURA EMITIDA</div>
      <div style="margin-top:8px;font-size:20px;font-weight:800;color:#1e293b">${inv.number}</div>
    </div>
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Reserva</div><div class="meta-value">${res?.code || inv.reservationId.slice(0,8)}</div></div>
      <div class="meta-item"><div class="meta-label">Huésped</div><div class="meta-value">${res?.guestName || "—"}</div></div>
      <div class="meta-item"><div class="meta-label">Check-in</div><div class="meta-value">${res ? new Date(res.checkIn).toLocaleDateString('es-MX') : '—'}</div></div>
      <div class="meta-item"><div class="meta-label">Check-out</div><div class="meta-value">${res ? new Date(res.checkOut).toLocaleDateString('es-MX') : '—'}</div></div>
      <div class="meta-item"><div class="meta-label">Fecha factura</div><div class="meta-value">${new Date(inv.createdAt).toLocaleDateString('es-MX')}</div></div>
      <div class="meta-item"><div class="meta-label">Estado</div><div class="meta-value">${inv.status.toUpperCase()}</div></div>
    </div>
    <table>
      <thead><tr><th>Concepto</th><th>Tipo</th><th>Cant.</th><th>P/U</th><th>Total</th></tr></thead>
      <tbody>
        ${folio.items.map(i => `<tr><td>${i.description}</td><td><span class="type-badge type-${i.type}">${i.type}</span></td><td>${i.qty}</td><td>$${i.unitPrice.toFixed(2)}</td><td>$${(i.qty*i.unitPrice).toFixed(2)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Subtotal (sin IVA)</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>IVA 16%</span><span>$${iva.toFixed(2)}</span></div>
      <div class="row-total"><span>TOTAL</span><span>$${folio.totalCharges.toFixed(2)} MXN</span></div>
      <div class="paid-row"><span>Pagado</span><span>-$${folio.totalPaid.toFixed(2)}</span></div>
      ${folio.balance > 0 ? `<div class="balance-row"><span>Saldo pendiente</span><span>$${folio.balance.toFixed(2)}</span></div>` : `<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:13px;font-weight:700;color:#22c55e"><span>✓ Saldo liquidado</span><span>$0.00</span></div>`}
    </div>
    <div class="footer">
      <p>Frontbot Hotel System · Qubica.AI</p>
      <p>Este documento es un comprobante demo. En producción: CFDI con firma SAT.</p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
