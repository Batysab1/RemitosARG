"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { accessRequests } from "@/db/schema";
import { requireSession } from "@/lib/guards";

const MAX_BYTES = 2 * 1024 * 1024;

function now() {
  return new Date();
}

export async function getMyAccessRequest() {
  const session = await requireSession();
  const row = await db.query.accessRequests.findFirst({ where: eq(accessRequests.userId, session.user.id) });
  return row ?? null;
}

export async function submitComprobante(comprobanteData: string) {
  const session = await requireSession();
  if (!comprobanteData.startsWith("data:image/")) {
    throw new Error("El comprobante debe ser una imagen (PNG, JPG o WEBP).");
  }
  const size = Buffer.byteLength(comprobanteData, "utf8");
  if (size > MAX_BYTES * 1.4) {
    throw new Error("El comprobante no puede pesar más de 2 MB.");
  }

  const existing = await db.query.accessRequests.findFirst({
    where: eq(accessRequests.userId, session.user.id),
  });
  const ts = now();
  if (existing) {
    await db.update(accessRequests)
      .set({ status: "en_revision", comprobanteData, submittedAt: ts, updatedAt: ts })
      .where(eq(accessRequests.id, existing.id))
      .run();
  } else {
    await db.insert(accessRequests).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      status: "en_revision",
      comprobanteData,
      submittedAt: ts,
      createdAt: ts,
      updatedAt: ts,
    }).run();
  }
  revalidatePath("/dashboard/acceso");
  revalidatePath("/dashboard/admin/pedidos");
}
