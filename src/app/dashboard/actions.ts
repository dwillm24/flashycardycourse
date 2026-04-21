"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { countDecksForUser, createDeckForUser } from "@/db/queries/decks";
import { isDeckCreationBlocked } from "@/lib/deck-limits";

export type CreateDeckInput = {
  title: string;
  description: string;
};

const createDeckInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z
    .string()
    .max(20_000)
    .transform((s) => {
      const t = s.trim();
      return t === "" ? null : t;
    }),
});

export type CreateDeckResult =
  | { ok: true; deckId: number }
  | { ok: false; error: string };

export async function createDeck(input: CreateDeckInput): Promise<CreateDeckResult> {
  const { userId, has } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const parsed = createDeckInputSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return { ok: false, error: message };
  }

  const deckCount = await countDecksForUser(userId);
  if (isDeckCreationBlocked(has, deckCount)) {
    return {
      ok: false,
      error:
        "Your plan allows up to 3 decks. Upgrade to Pro for unlimited decks.",
    };
  }

  const row = await createDeckForUser({
    clerkUserId: userId,
    title: parsed.data.title,
    description: parsed.data.description,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/decks/${row.id}`);

  return { ok: true, deckId: row.id };
}
