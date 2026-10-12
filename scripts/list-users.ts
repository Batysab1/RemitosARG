import { db } from "@/db";
import { user } from "@/db/schema";

async function main() {
  const rows = await db.select({ email: user.email }).from(user);
  console.log("USERS:", JSON.stringify(rows));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
