import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accessRequests } from "@/db/schema";

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function hasApprovedAccess(userId: string, email?: string | null): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  const row = await db.query.accessRequests.findFirst({ where: eq(accessRequests.userId, userId) });
  return row?.status === "aprobado";
}

export async function getPendingReviewCount(): Promise<number> {
  const rows = await db.query.accessRequests.findMany({
    where: eq(accessRequests.status, "en_revision"),
  });
  return rows.length;
}
