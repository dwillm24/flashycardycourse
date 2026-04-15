import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cardsTable, decksTable } from "@/db/schema";

export type DeckSeed = {
  title: string;
  description: string;
  cards: Array<{ front: string; back: string }>;
};

export async function upsertExampleDeckWithCards(input: {
  clerkUserId: string;
  seed: DeckSeed;
}): Promise<{
  deckId: number;
  createdDeck: boolean;
  insertedCards: number;
  skippedCards: boolean;
}> {
  const { clerkUserId, seed } = input;

  const existingDeck = await db
    .select({ id: decksTable.id })
    .from(decksTable)
    .where(
      and(
        eq(decksTable.clerkUserId, clerkUserId),
        eq(decksTable.title, seed.title)
      )
    )
    .limit(1);

  const deckId =
    existingDeck[0]?.id ??
    (
      await db
        .insert(decksTable)
        .values({
          clerkUserId,
          title: seed.title,
          description: seed.description,
        })
        .returning({ id: decksTable.id })
    )[0]!.id;

  const existingCard = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .limit(1);

  if (existingCard.length > 0) {
    return {
      deckId,
      createdDeck: existingDeck.length === 0,
      insertedCards: 0,
      skippedCards: true,
    };
  }

  const cardRows = seed.cards.map((c) => ({
    deckId,
    front: c.front,
    back: c.back,
  }));

  await db.insert(cardsTable).values(cardRows);

  return {
    deckId,
    createdDeck: existingDeck.length === 0,
    insertedCards: cardRows.length,
    skippedCards: false,
  };
}
