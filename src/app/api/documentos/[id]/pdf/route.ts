import { NextResponse } from "next/server";
import { existsSync } from "fs";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { getDocument } from "@/actions/documents";
import { documentHtml } from "@/lib/document-html";

export const maxDuration = 60;

function findLocalChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(/*turbopackIgnore: true*/ candidate)) return candidate;
  }
  return null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const items = document.items.map((entry) => ({ codigo: entry.codigo, descripcion: entry.descripcion, cantidad: entry.cantidad, unidad: entry.unidad, precio: entry.precio, descuento: entry.descuento, ivaTasa: entry.ivaTasa }));
  const html = documentHtml({
    tipo: document.tipo,
    numero: document.numero,
    fecha: document.fecha,
    condVenta: document.condVenta,
    validezDias: document.validezDias,
    cliente: JSON.parse(document.clienteSnapshot),
    emisor: JSON.parse(document.emisorSnapshot),
    items,
    subtotal: document.subtotal,
    iva: document.iva,
    total: document.total,
    observaciones: document.observaciones,
  });

  const isVercel = !!process.env.VERCEL;
  const executablePath = isVercel ? await chromium.executablePath() : findLocalChrome();
  if (!executablePath) {
    return NextResponse.json(
      { error: "No se encontró Chrome para generar el PDF. Definí CHROME_PATH en el servidor." },
      { status: 500 },
    );
  }
  let browser;
  try {
    browser = await puppeteerCore.launch({
      headless: true,
      executablePath,
      args: isVercel
        ? [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"]
        : ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar Chrome para generar el PDF." }, { status: 500 });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    return new NextResponse(pdf as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${document.tipo}-${document.numero}.pdf"` } });
  } finally {
    await browser.close();
  }
}
