import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { decksTable } from "@/db/schema";

export type DeckRow = typeof decksTable.$inferSelect;

export async function listDecksForUser(clerkUserId: string): Promise<DeckRow[]> {
  return db
    .select()
    .from(decksTable)
    .where(eq(decksTable.clerkUserId, clerkUserId))
    .orderBy(desc(decksTable.updatedAt));
}

export async function createDeckForUser(input: {
  clerkUserId: string;
  title: string;
  description?: string | null;
}): Promise<{ id: number }> {
  const [row] = await db
    .insert(decksTable)
    .values({
      clerkUserId: input.clerkUserId,
      title: input.title,
      description: input.description ?? null,
    })
    .returning({ id: decksTable.id });

  if (row == null) {
    throw new Error("Failed to create deck");
  }

  return row;
}

export async function getDeckTitleForOwner(params: {
  deckId: number;
  clerkUserId: string;
}): Promise<string | undefined> {
  const [row] = await db
    .select({ title: decksTable.title })
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, params.deckId),
        eq(decksTable.clerkUserId, params.clerkUserId)
      )
    )
    .limit(1);

  return row?.title;
}

export async function getDeckForOwner(params: {
  deckId: number;
  clerkUserId: string;
}): Promise<DeckRow | undefined> {
  const [row] = await db
    .select()
    .from(decksTable)
    .where(
      and(
        eq(decksTable.id, params.deckId),
        eq(decksTable.clerkUserId, params.clerkUserId)
      )
    )
    .limit(1);

  return row;
}

export async function updateDeckForOwner(input: {
  deckId: number;
  clerkUserId: string;
  title: string;
  description: string | null;
}): Promise<boolean> {
  const rows = await db
    .update(decksTable)
    .set({
      title: input.title,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(decksTable.id, input.deckId),
        eq(decksTable.clerkUserId, input.clerkUserId)
      )
    )
    .returning({ id: decksTable.id });

  return rows.length > 0;
}

export async function deleteDeckForOwner(params: {
  deckId: number;
  clerkUserId: string;
}): Promise<boolean> {
  const rows = await db
    .delete(decksTable)
    .where(
      and(
        eq(decksTable.id, params.deckId),
        eq(decksTable.clerkUserId, params.clerkUserId)
      )
    )
    .returning({ id: decksTable.id });

  return rows.length > 0;
}

/** Local diagnostics only — not scoped to a user. */
export async function listDecksLimit(limit: number): Promise<DeckRow[]> {
  return db.select().from(decksTable).limit(limit);
}

export async function listDeckSummariesForUser(
  clerkUserId: string
): Promise<Array<{ id: number; title: string }>> {
  return db
    .select({ id: decksTable.id, title: decksTable.title })
    .from(decksTable)
    .where(eq(decksTable.clerkUserId, clerkUserId));
}
