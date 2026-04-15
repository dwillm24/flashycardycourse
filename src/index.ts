import "dotenv/config";
import { listDecksLimit } from "@/db/queries/decks";

async function main() {
  const decks = await listDecksLimit(5);
  console.log("OK", { deckCount: decks.length });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
