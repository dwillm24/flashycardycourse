import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { decksTable } from "./db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

async function main() {
  const decks = await db.select().from(decksTable).limit(5);
  console.log("OK", { deckCount: decks.length });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
