import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasApprovedAccess } from "@/lib/access";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/dashboard");
  return session;
}

export async function requireSubscription() {
  const session = await requireSession();
  if (!(await hasApprovedAccess(session.user.id, session.user.email))) redirect("/dashboard/acceso");
  return session;
}
