import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cardsTable, decksTable } from "@/db/schema";

export type CardRow = typeof cardsTable.$inferSelect;

export async function listCardsForDeckOwner(params: {
  deckId: number;
  clerkUserId: string;
}): Promise<CardRow[]> {
  const rows = await db
    .select({
      id: cardsTable.id,
      deckId: cardsTable.deckId,
      front: cardsTable.front,
      back: cardsTable.back,
      fontFamily: cardsTable.fontFamily,
      textColor: cardsTable.textColor,
      createdAt: cardsTable.createdAt,
      updatedAt: cardsTable.updatedAt,
    })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(
      and(
        eq(cardsTable.deckId, params.deckId),
        eq(decksTable.clerkUserId, params.clerkUserId)
      )
    )
    .orderBy(desc(cardsTable.updatedAt));

  return rows;
}

export async function createCardForDeckOwner(input: {
  deckId: number;
  clerkUserId: string;
  front: string;
  back: string;
  fontFamily: string | null;
  textColor: string | null;
}): Promise<{ id: number } | null> {
  const [deck] = await db
    .select({ id: decksTable.id })
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, input.deckId),
        eq(decksTable.clerkUserId, input.clerkUserId)
      )
    )
    .limit(1);

  if (deck == null) {
    return null;
  }

  const [row] = await db
    .insert(cardsTable)
    .values({
      deckId: input.deckId,
      front: input.front,
      back: input.back,
      fontFamily: input.fontFamily,
      textColor: input.textColor,
    })
    .returning({ id: cardsTable.id });

  if (row == null) {
    throw new Error("Failed to create card");
  }

  return row;
}

export async function updateCardForDeckOwner(input: {
  deckId: number;
  cardId: number;
  clerkUserId: string;
  front: string;
  back: string;
  fontFamily: string | null;
  textColor: string | null;
}): Promise<boolean> {
  const [owned] = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(
      and(
        eq(cardsTable.id, input.cardId),
        eq(cardsTable.deckId, input.deckId),
        eq(decksTable.clerkUserId, input.clerkUserId)
      )
    )
    .limit(1);

  if (owned == null) {
    return false;
  }

  await db
    .update(cardsTable)
    .set({
      front: input.front,
      back: input.back,
      fontFamily: input.fontFamily,
      textColor: input.textColor,
      updatedAt: new Date(),
    })
    .where(eq(cardsTable.id, input.cardId));

  return true;
}

export async function deleteCardForDeckOwner(input: {
  deckId: number;
  cardId: number;
  clerkUserId: string;
}): Promise<boolean> {
  const [owned] = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(
      and(
        eq(cardsTable.id, input.cardId),
        eq(cardsTable.deckId, input.deckId),
        eq(decksTable.clerkUserId, input.clerkUserId)
      )
    )
    .limit(1);

  if (owned == null) {
    return false;
  }

  await db
    .delete(cardsTable)
    .where(and(eq(cardsTable.id, input.cardId), eq(cardsTable.deckId, input.deckId)));

  return true;
}
