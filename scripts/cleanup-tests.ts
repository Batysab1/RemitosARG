import { like, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

async function main() {
  const rows = await db
    .delete(user)
    .where(or(like(user.email, "fresco-%"), like(user.email, "browser-%")))
    .returning({ email: user.email });
  console.log(`Eliminados ${rows.length}:`, JSON.stringify(rows.map((r) => r.email)));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
