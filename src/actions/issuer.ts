"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { issuers } from "@/db/schema";
import { requireSession } from "@/lib/guards";

export type IssuerInput = {
  razonSocial: string;
  nombreComercial: string;
  cuit: string;
  condicionIva: string;
  domicilio: string;
  localidad: string;
  telefono: string;
  logoData?: string | null;
};

export async function getIssuer() {
  const session = await requireSession();
  return (await db.select().from(issuers).where(eq(issuers.userId, session.user.id)).get()) ?? null;
}

export async function upsertIssuer(input: IssuerInput) {
  const session = await requireSession();
  const existing = await db.select().from(issuers).where(eq(issuers.userId, session.user.id)).get();
  const now = new Date();
  if (existing) {
    await db.update(issuers)
      .set({ ...input, updatedAt: now })
      .where(eq(issuers.id, existing.id))
      .run();
  } else {
    await db.insert(issuers).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      ...input,
      createdAt: now,
      updatedAt: now,
    }).run();
  }
  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/documentos");
}
