"use server";

import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accessRequests, user } from "@/db/schema";
import { requireSession } from "@/lib/guards";
import { isAdminEmail } from "@/lib/access";

function now() {
  return new Date();
}

async function requireAdmin() {
  const session = await requireSession();
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");
  return session;
}

export async function listAccessRequests() {
  await requireAdmin();
  const rows = await db
    .select({
      id: accessRequests.id,
      userId: accessRequests.userId,
      status: accessRequests.status,
      comprobanteData: accessRequests.comprobanteData,
      notaAdmin: accessRequests.notaAdmin,
      submittedAt: accessRequests.submittedAt,
      reviewedAt: accessRequests.reviewedAt,
      createdAt: accessRequests.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(accessRequests)
    .leftJoin(user, eq(accessRequests.userId, user.id))
    .orderBy(desc(accessRequests.updatedAt));
  return rows;
}

export async function approveAccessRequest(requestId: string) {
  await requireAdmin();
  const ts = now();
  await db.update(accessRequests)
    .set({ status: "aprobado", reviewedAt: ts, updatedAt: ts })
    .where(eq(accessRequests.id, requestId))
    .run();
  revalidatePath("/dashboard/admin/pedidos");
  revalidatePath("/dashboard/acceso");
}

export async function rejectAccessRequest(requestId: string, notaAdmin: string) {
  await requireAdmin();
  const ts = now();
  await db.update(accessRequests)
    .set({ status: "rechazado", notaAdmin: notaAdmin.slice(0, 500), reviewedAt: ts, updatedAt: ts })
    .where(eq(accessRequests.id, requestId))
    .run();
  revalidatePath("/dashboard/admin/pedidos");
  revalidatePath("/dashboard/acceso");
}
