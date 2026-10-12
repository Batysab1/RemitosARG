import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Diagnóstico de configuración (sin exponer secretos): dice qué env vars
// ve el runtime. Útil para verificar el deploy en Vercel.
export async function GET() {
  const secret = process.env.BETTER_AUTH_SECRET ?? "";
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_AUTH_TOKEN: !!process.env.DATABASE_AUTH_TOKEN,
      BETTER_AUTH_SECRET: secret.length >= 32,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? null,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
      ADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
    },
  });
}
