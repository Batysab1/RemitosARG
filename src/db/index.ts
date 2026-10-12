import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./gestion.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const db = drizzle(createClient({ url, authToken }), { schema });
