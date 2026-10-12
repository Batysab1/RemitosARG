"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients, counters, documentItems, documents, issuers, movements, products } from "@/db/schema";
import { requireSubscription } from "@/lib/guards";
import { normalizeIvaTasa } from "@/lib/iva";

export type DocumentItemInput = { productId?: string; codigo: string; descripcion: string; cantidad: number; unidad: string; precio: number; descuento: number; ivaTasa: number };

export type DocumentType = "remito" | "presupuesto" | "recibo";

function totals(items: DocumentItemInput[]) {
  let subtotal = 0; let iva = 0;
  for (const item of items) { const base = Math.max(0, item.cantidad * item.precio * (1 - item.descuento / 100)); subtotal += base; iva += base * (normalizeIvaTasa(item.ivaTasa) / 100); }
  return { subtotal, iva, total: subtotal + iva };
}

export async function createDocument(input: { tipo: DocumentType; fecha: string; clienteId: string; condVenta: string; validezDias: number; observaciones: string; items: DocumentItemInput[] }) {
  const session = await requireSubscription();
  if (!input.clienteId || input.items.length === 0) throw new Error("Seleccioná cliente y al menos un ítem");
  const client = await db.select().from(clients).where(and(eq(clients.id, input.clienteId), eq(clients.userId, session.user.id))).get();
  if (!client) throw new Error("Cliente no encontrado");
  const issuer = await db.select().from(issuers).where(eq(issuers.userId, session.user.id)).get();
  const { subtotal, iva, total } = totals(input.items);
  const documentId = crypto.randomUUID(); const createdAt = new Date();
  const result = await db.transaction(async (tx) => {
    const counter = await tx.select().from(counters).where(and(eq(counters.userId, session.user.id), eq(counters.tipo, input.tipo))).get();
    const numero = counter?.proximoNumero ?? 1;
    if (counter) await tx.update(counters).set({ proximoNumero: numero + 1 }).where(eq(counters.id, counter.id)).run();
    else await tx.insert(counters).values({ id: crypto.randomUUID(), userId: session.user.id, tipo: input.tipo, proximoNumero: numero + 1 }).run();
    const clientSnapshot = JSON.stringify(client);
    const issuerSnapshot = JSON.stringify(issuer ?? { razonSocial: "", nombreComercial: "", cuit: "", condicionIva: "", domicilio: "", localidad: "", telefono: "", logoData: null });
    await tx.insert(documents).values({ id: documentId, userId: session.user.id, tipo: input.tipo, numero, fecha: input.fecha, estado: input.tipo === "presupuesto" ? "borrador" : "emitido", clienteSnapshot: clientSnapshot, emisorSnapshot: issuerSnapshot, condVenta: input.condVenta, validezDias: input.validezDias, observaciones: input.observaciones, subtotal, iva, total, createdAt }).run();
    for (const item of input.items) {
      await tx.insert(documentItems).values({ id: crypto.randomUUID(), documentId, productId: item.productId ?? null, codigo: item.codigo, descripcion: item.descripcion, cantidad: item.cantidad, unidad: item.unidad, precio: item.precio, descuento: item.descuento, ivaTasa: item.ivaTasa }).run();
      if (input.tipo === "remito" && item.productId) {
        const product = await tx.select().from(products).where(and(eq(products.id, item.productId), eq(products.userId, session.user.id))).get();
        if (!product) throw new Error(`Producto no encontrado: ${item.descripcion}`);
        await tx.update(products).set({ stockActual: product.stockActual - item.cantidad }).where(eq(products.id, item.productId)).run();
        await tx.insert(movements).values({ id: crypto.randomUUID(), userId: session.user.id, productId: item.productId, tipo: "egreso", cantidad: item.cantidad, motivo: `Remito ${numero}`, documentId, createdAt }).run();
      }
    }
    return { id: documentId, numero };
  });
  revalidatePath("/dashboard/documentos"); revalidatePath("/dashboard/stock"); revalidatePath("/dashboard");
  return result;
}

export async function listDocuments(tipo?: DocumentType) {
  const session = await requireSubscription();
  const where = tipo ? and(eq(documents.userId, session.user.id), eq(documents.tipo, tipo)) : eq(documents.userId, session.user.id);
  return db.select().from(documents).where(where).orderBy(desc(documents.createdAt)).limit(200);
}

export async function getDocument(id: string) {
  const session = await requireSubscription();
  const doc = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, session.user.id))).get();
  if (!doc) return null;
  const items = await db.select().from(documentItems).where(eq(documentItems.documentId, id)).orderBy(asc(documentItems.id)).all();
  return { ...doc, items };
}

async function getOwnedPresupuesto(id: string) {
  const session = await requireSubscription();
  const doc = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, session.user.id))).get();
  if (!doc || doc.tipo !== "presupuesto") throw new Error("Presupuesto no encontrado");
  return doc;
}

export async function approvePresupuesto(id: string) {
  const doc = await getOwnedPresupuesto(id);
  if (doc.estado !== "borrador") throw new Error("Solo se puede aprobar un presupuesto en borrador");
  await db.update(documents).set({ estado: "aprobado" }).where(eq(documents.id, id)).run();
  revalidatePath("/dashboard/documentos");
  revalidatePath(`/dashboard/documentos/${id}`);
  revalidatePath("/dashboard");
}

export async function rejectPresupuesto(id: string) {
  const doc = await getOwnedPresupuesto(id);
  if (doc.estado !== "borrador" && doc.estado !== "aprobado") throw new Error("Este presupuesto ya está cerrado");
  await db.update(documents).set({ estado: "rechazado" }).where(eq(documents.id, id)).run();
  revalidatePath("/dashboard/documentos");
  revalidatePath(`/dashboard/documentos/${id}`);
  revalidatePath("/dashboard");
}

export async function convertPresupuestoToRemito(id: string) {
  const doc = await getDocument(id);
  if (!doc || doc.tipo !== "presupuesto") throw new Error("Presupuesto no encontrado");
  if (doc.estado !== "aprobado") throw new Error("Aprobá el presupuesto antes de convertirlo a remito");
  const clientData = JSON.parse(doc.clienteSnapshot) as { id?: string };
  if (!clientData?.id) throw new Error("No se pudo identificar el cliente original");
  const result = await createDocument({
    tipo: "remito",
    fecha: new Date().toISOString().slice(0, 10),
    clienteId: clientData.id,
    condVenta: doc.condVenta,
    validezDias: doc.validezDias,
    observaciones: doc.observaciones,
    items: doc.items.map((item) => ({ productId: item.productId ?? undefined, codigo: item.codigo, descripcion: item.descripcion, cantidad: item.cantidad, unidad: item.unidad, precio: item.precio, descuento: item.descuento, ivaTasa: item.ivaTasa })),
  });
  const note = `Convertido a remito Nº ${result.numero}`;
  await db.update(documents).set({ estado: "convertido", observaciones: doc.observaciones ? `${doc.observaciones}\n${note}` : note }).where(eq(documents.id, id)).run();
  revalidatePath("/dashboard/documentos");
  revalidatePath(`/dashboard/documentos/${id}`);
  revalidatePath("/dashboard");
  return result;
}

export async function convertPresupuestoToRecibo(id: string) {
  const doc = await getDocument(id);
  if (!doc || doc.tipo !== "presupuesto") throw new Error("Presupuesto no encontrado");
  if (doc.estado !== "aprobado") throw new Error("Aprobá el presupuesto antes de convertirlo a recibo");
  const clientData = JSON.parse(doc.clienteSnapshot) as { id?: string };
  if (!clientData?.id) throw new Error("No se pudo identificar el cliente original");
  const result = await createDocument({
    tipo: "recibo",
    fecha: new Date().toISOString().slice(0, 10),
    clienteId: clientData.id,
    condVenta: doc.condVenta,
    validezDias: doc.validezDias,
    observaciones: doc.observaciones,
    items: doc.items.map((item) => ({ productId: item.productId ?? undefined, codigo: item.codigo, descripcion: item.descripcion, cantidad: item.cantidad, unidad: item.unidad, precio: item.precio, descuento: item.descuento, ivaTasa: item.ivaTasa })),
  });
  const note = `Convertido a recibo Nº ${result.numero}`;
  await db.update(documents).set({ estado: "convertido", observaciones: doc.observaciones ? `${doc.observaciones}\n${note}` : note }).where(eq(documents.id, id)).run();
  revalidatePath("/dashboard/documentos");
  revalidatePath(`/dashboard/documentos/${id}`);
  revalidatePath("/dashboard");
  return result;
}
