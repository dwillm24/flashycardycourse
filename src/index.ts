import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { usersTable } from "./db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

async function main() {
  const user: typeof usersTable.$inferInsert = {
    name: "John",
    age: 30,
    email: `john+${Date.now()}@example.com`,
  };

  await db.insert(usersTable).values(user);
  const users = await db.select().from(usersTable);

  await db
    .update(usersTable)
    .set({ age: 31 })
    .where(eq(usersTable.email, user.email));

  await db.delete(usersTable).where(eq(usersTable.email, user.email));

  console.log("OK", { inserted: user.email, usersCount: users.length });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

