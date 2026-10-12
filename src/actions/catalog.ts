"use server";

import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients, products } from "@/db/schema";
import { requireSubscription } from "@/lib/guards";

const now = () => new Date();

export async function createClient(formData: FormData) {
  const session = await requireSubscription();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio");
  await db.insert(clients).values({ id: crypto.randomUUID(), userId: session.user.id, nombre, cuit: String(formData.get("cuit") ?? ""), condicionIva: String(formData.get("condicionIva") ?? "Consumidor Final"), domicilio: String(formData.get("domicilio") ?? ""), localidad: String(formData.get("localidad") ?? ""), telefono: String(formData.get("telefono") ?? ""), email: String(formData.get("email") ?? ""), createdAt: now() });
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard");
}

export async function deleteClient(id: string) {
  const session = await requireSubscription();
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, session.user.id)));
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard");
}

export async function createProduct(formData: FormData) {
  const session = await requireSubscription();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio");
  await db.insert(products).values({ id: crypto.randomUUID(), userId: session.user.id, codigo: String(formData.get("codigo") ?? ""), nombre, descripcion: String(formData.get("descripcion") ?? ""), precio: Number(formData.get("precio") ?? 0) || 0, unidad: String(formData.get("unidad") ?? "u."), stockActual: Number(formData.get("stockActual") ?? 0) || 0, stockMinimo: Number(formData.get("stockMinimo") ?? 0) || 0, createdAt: now() });
  revalidatePath("/dashboard/productos");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard");
}

export async function deleteProduct(id: string) {
  const session = await requireSubscription();
  await db.delete(products).where(and(eq(products.id, id), eq(products.userId, session.user.id)));
  revalidatePath("/dashboard/productos");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard");
}

export async function listClients() {
  const session = await requireSubscription();
  return db.select().from(clients).where(eq(clients.userId, session.user.id)).orderBy(asc(clients.nombre));
}

export async function listProducts() {
  const session = await requireSubscription();
  return db.select().from(products).where(eq(products.userId, session.user.id)).orderBy(asc(products.nombre));
}
