import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const auth = betterAuth({
  appName: "RemitosARG",
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 256,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[reset-password] ${user.email}: ${url}`);
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 5 },
      "/api/auth/sign-up/email": { window: 60, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: process.env.BETTER_AUTH_SECURE_COOKIES
      ? process.env.BETTER_AUTH_SECURE_COOKIES === "true"
      : (process.env.BETTER_AUTH_URL ?? "").startsWith("https"),
    disableCSRFCheck: false,
    disableOriginCheck: false,
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 300, strategy: "compact" } },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
