"use server";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { movements, products } from "@/db/schema";
import { requireSubscription } from "@/lib/guards";

export async function adjustStock(formData: FormData) {
  const session = await requireSubscription();
  const productId = String(formData.get("productId") ?? "");
  const tipo = String(formData.get("tipo") ?? "ajuste") as "ingreso" | "egreso" | "ajuste";
  const cantidad = Number(formData.get("cantidad") ?? 0);
  if (!productId || !Number.isFinite(cantidad) || cantidad <= 0) throw new Error("Movimiento inválido");
  const delta = tipo === "ingreso" ? cantidad : tipo === "egreso" ? -cantidad : Number(formData.get("delta") ?? 0);
  await db.transaction(async (tx) => {
    const product = await tx.select().from(products).where(and(eq(products.id, productId), eq(products.userId, session.user.id))).get();
    if (!product) throw new Error("Producto no encontrado");
    if (tipo === "egreso" && product.stockActual < cantidad) throw new Error(`Stock insuficiente: hay ${product.stockActual} ${product.unidad}`);
    await tx.update(products).set({ stockActual: sql`${products.stockActual} + ${delta}` }).where(eq(products.id, productId)).run();
    await tx.insert(movements).values({ id: crypto.randomUUID(), userId: session.user.id, productId, tipo, cantidad: Math.abs(delta), motivo: String(formData.get("motivo") ?? "Ajuste manual"), createdAt: new Date() }).run();
  });
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/productos");
  revalidatePath("/dashboard");
}

export async function listStock() {
  const session = await requireSubscription();
  return db.select().from(products).where(eq(products.userId, session.user.id)).orderBy(desc(products.stockActual));
}

export async function listMovements() {
  const session = await requireSubscription();
  return db.select().from(movements).where(eq(movements.userId, session.user.id)).orderBy(desc(movements.createdAt)).limit(100);
}

export type DailyMovement = { key: string; label: string; ingresos: number; egresos: number };
export type TopSold = { productId: string; nombre: string; unidades: number };

export async function getMovementStats(days = 14): Promise<{ daily: DailyMovement[]; topSold: TopSold[]; totalIngresos: number; totalEgresos: number }> {
  const session = await requireSubscription();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const rows = await db
    .select({ tipo: movements.tipo, cantidad: movements.cantidad, productId: movements.productId, nombre: products.nombre, createdAt: movements.createdAt })
    .from(movements)
    .leftJoin(products, eq(movements.productId, products.id))
    .where(and(eq(movements.userId, session.user.id), gte(movements.createdAt, since)))
    .limit(2000);

  const daily: DailyMovement[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({
      key,
      label: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      ingresos: 0,
      egresos: 0,
    });
  }
  const byDay = new Map(daily.map((d) => [d.key, d]));
  let totalIngresos = 0;
  let totalEgresos = 0;
  const sold = new Map<string, { nombre: string; unidades: number }>();
  for (const row of rows) {
    const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
    const bucket = byDay.get(created.toISOString().slice(0, 10));
    if (row.tipo === "egreso") {
      totalEgresos += row.cantidad;
      if (bucket) bucket.egresos += row.cantidad;
      const prev = sold.get(row.productId) ?? { nombre: row.nombre ?? "Producto eliminado", unidades: 0 };
      prev.unidades += row.cantidad;
      sold.set(row.productId, prev);
    } else {
      totalIngresos += row.cantidad;
      if (bucket) bucket.ingresos += row.cantidad;
    }
  }
  const topSold: TopSold[] = [...sold.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 8);
  return { daily, topSold, totalIngresos, totalEgresos };
}
