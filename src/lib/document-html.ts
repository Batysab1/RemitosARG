import type { DocumentItemInput } from "@/actions/documents";
import { ivaLabel } from "@/lib/iva";

export function documentHtml(input: {
  tipo: "remito" | "presupuesto" | "recibo";
  numero: number;
  fecha: string;
  condVenta?: string;
  validezDias?: number;
  cliente: Record<string, unknown>;
  emisor: Record<string, unknown>;
  items: DocumentItemInput[];
  subtotal: number;
  iva: number;
  total: number;
  observaciones: string;
}) {
  const esc = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ars = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
  const pct = (value: number) => `${value}%`;
  const logo = input.emisor.logoData ? `<img src="${esc(input.emisor.logoData)}" class="issuer-logo" alt="">` : "";
  const validez = input.tipo === "presupuesto" && input.validezDias ? `<div class="meta-row"><span>Validez</span><strong>${input.validezDias} días</strong></div>` : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1f2937;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 0;
    }
    .page { width: 100%; max-width: 186mm; margin: 0 auto; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
    .issuer { flex: 1; }
    .issuer-logo { max-height: 52px; max-width: 160px; object-fit: contain; margin-bottom: 8px; }
    .issuer-name { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .issuer-legal { font-size: 12px; font-weight: 600; color: #334155; margin-top: 2px; }
    .issuer-meta { margin-top: 6px; color: #475569; font-size: 10px; line-height: 1.55; }
    .doc-box { min-width: 150px; border: 1.5px solid #0f172a; border-radius: 6px; padding: 10px 12px; text-align: right; }
    .doc-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
    .doc-type { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .doc-num { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #0f172a; margin-top: 4px; }
    .meta-row { display: flex; justify-content: space-between; gap: 10px; margin-top: 3px; color: #475569; font-size: 10px; }
    .meta-row strong { color: #0f172a; font-weight: 600; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; background: #f8fafc; }
    .box-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
    .box strong { color: #0f172a; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th, td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-weight: 700; }
    td.num, th.num { text-align: right; }
    td { color: #334155; }
    .totals { width: 220px; margin-left: auto; margin-top: 90px; padding-top: 22px; border-top: 1px solid #e2e8f0; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .totals .row.total { border-bottom: 0; border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 9px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .observations { margin-top: 18px; }
    .observations-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 3px; }
    .observations-text { min-height: 70px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 9px; color: #334155; background: #fff; }
    .signatures { display: flex; gap: 24px; margin-top: 150px; break-inside: avoid; }
    .signature { flex: 1; text-align: center; }
    .signature-line { border-top: 1px solid #334155; margin-top: 90px; padding-top: 5px; color: #475569; font-size: 10px; }
    .footer { margin-top: 28px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <div class="page">
    <div class="top">
      <div class="issuer">
        ${logo}
        <div class="issuer-name">${esc(input.emisor.nombreComercial || input.emisor.razonSocial || "Tu empresa")}</div>
        ${input.emisor.razonSocial && input.emisor.nombreComercial ? `<div class="issuer-legal">${esc(input.emisor.razonSocial)}</div>` : ""}
        <div class="issuer-meta">
          ${input.emisor.cuit ? `<div>CUIT: ${esc(input.emisor.cuit)} · ${esc(input.emisor.condicionIva)}</div>` : ""}
          ${input.emisor.domicilio ? `<div>${esc(input.emisor.domicilio)}${input.emisor.localidad ? `, ${esc(input.emisor.localidad)}` : ""}</div>` : ""}
          ${input.emisor.telefono ? `<div>${esc(input.emisor.telefono)}</div>` : ""}
        </div>
      </div>
      <div class="doc-box">
        <div class="doc-label">Documento</div>
        <div class="doc-type">${esc(input.tipo.toUpperCase())}</div>
        <div class="doc-num">Nº ${String(input.numero).padStart(8, "0")}</div>
        <div class="meta-row"><span>Fecha</span><strong>${esc(input.fecha)}</strong></div>
        ${input.condVenta ? `<div class="meta-row"><span>Condición</span><strong>${esc(input.condVenta)}</strong></div>` : ""}
        ${validez}
      </div>
    </div>

    <div class="box">
      <div class="box-label">Cliente</div>
      <strong>${esc(input.cliente.nombre)}</strong>
      <div>${esc(input.cliente.cuit)} · ${esc(input.cliente.condicionIva)}</div>
      <div>${esc(input.cliente.domicilio)}${input.cliente.localidad ? `, ${esc(input.cliente.localidad)}` : ""}</div>
      ${input.cliente.telefono ? `<div>${esc(input.cliente.telefono)}</div>` : ""}
    </div>

    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Descripción</th>
          <th class="num">Cantidad</th>
          <th class="num">Precio unit.</th>
          <th class="num">Dto.</th>
          <th class="num">IVA</th>
          <th class="num">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${input.items.map((item) => {
          const base = item.cantidad * item.precio * (1 - item.descuento / 100);
          return `<tr>
            <td>${esc(item.codigo)}</td>
            <td>${esc(item.descripcion)}</td>
            <td class="num">${item.cantidad} ${esc(item.unidad)}</td>
            <td class="num">${ars(item.precio)}</td>
            <td class="num">${item.descuento ? pct(item.descuento) : "—"}</td>
            <td class="num">${ivaLabel(item.ivaTasa)}</td>
            <td class="num">${ars(base)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${ars(input.subtotal)}</span></div>
      <div class="row"><span>IVA</span><span>${ars(input.iva)}</span></div>
      <div class="row total"><span>Total</span><span>${ars(input.total)}</span></div>
    </div>

    <div class="observations">
      <div class="observations-label">Observaciones</div>
      <div class="observations-text">${input.observaciones ? esc(input.observaciones) : "—"}</div>
    </div>

    <div class="signatures">
      <div class="signature">
        <div class="signature-line">
          Firma y aclaración del vendedor
        </div>
      </div>
      <div class="signature">
        <div class="signature-line">
          Firma y aclaración del comprador / Recibí conforme
        </div>
      </div>
    </div>

    <div class="footer">Documento no válido como factura</div>
  </div>
</body>
</html>`;
}
