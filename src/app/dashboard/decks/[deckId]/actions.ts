"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createCardForDeckOwner,
  deleteCardForDeckOwner,
  updateCardForDeckOwner,
} from "@/db/queries/cards";
import { deleteDeckForOwner, updateDeckForOwner } from "@/db/queries/decks";
import { CARD_FONT_OPTIONS } from "@/lib/card-appearance";

const updateDeckSchema = z.object({
  deckId: z.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z
    .string()
    .max(20_000)
    .transform((s) => {
      const t = s.trim();
      return t === "" ? null : t;
    }),
});

export type UpdateDeckInput = {
  deckId: number;
  title: string;
  description: string;
};

export async function updateDeck(input: UpdateDeckInput) {
  const { userId } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const parsed = updateDeckSchema.parse({
    deckId: input.deckId,
    title: input.title,
    description: input.description,
  });

  const ok = await updateDeckForOwner({
    deckId: parsed.deckId,
    clerkUserId: userId,
    title: parsed.title,
    description: parsed.description,
  });

  if (!ok) {
    throw new Error("Deck not found or access denied");
  }

  revalidatePath(`/dashboard/decks/${parsed.deckId}`);
  revalidatePath("/dashboard");
}

const deleteDeckSchema = z.object({
  deckId: z.number().int().positive(),
});

export type DeleteDeckInput = {
  deckId: number;
};

export async function deleteDeck(
  input: DeleteDeckInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const parsed = deleteDeckSchema.parse(input);

  const ok = await deleteDeckForOwner({
    deckId: parsed.deckId,
    clerkUserId: userId,
  });

  if (!ok) {
    return { ok: false, error: "Deck not found or access denied" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/decks/${parsed.deckId}/study`);
  return { ok: true };
}

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use a valid hex color like #2563eb");

const cardContentSchema = z.object({
  front: z.string().trim().min(1, "Front text is required").max(20_000),
  back: z.string().trim().min(1, "Back text is required").max(20_000),
  fontFamily: z.union([z.enum(CARD_FONT_OPTIONS), z.null()]),
  textColor: z.union([hexColor, z.null()]),
});

function normalizeFont(value: string | null | undefined): string | null {
  if (value == null || value === "" || value === "default") {
    return null;
  }
  if (CARD_FONT_OPTIONS.includes(value as (typeof CARD_FONT_OPTIONS)[number])) {
    return value as (typeof CARD_FONT_OPTIONS)[number];
  }
  return null;
}

function normalizeColor(value: string | null | undefined): string | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = hexColor.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type CreateCardInput = {
  deckId: number;
  front: string;
  back: string;
  fontFamily?: string | null;
  textColor?: string | null;
};

export async function createCard(input: CreateCardInput) {
  const { userId } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const parsed = cardContentSchema.parse({
    front: input.front,
    back: input.back,
    fontFamily: normalizeFont(input.fontFamily),
    textColor: normalizeColor(input.textColor),
  });

  const row = await createCardForDeckOwner({
    deckId: input.deckId,
    clerkUserId: userId,
    front: parsed.front,
    back: parsed.back,
    fontFamily: parsed.fontFamily,
    textColor: parsed.textColor,
  });

  if (row == null) {
    throw new Error("Deck not found or access denied");
  }

  revalidatePath(`/dashboard/decks/${input.deckId}`);
}

export type UpdateCardInput = {
  deckId: number;
  cardId: number;
  front: string;
  back: string;
  fontFamily?: string | null;
  textColor?: string | null;
};

export async function updateCard(input: UpdateCardInput) {
  const { userId } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const parsed = cardContentSchema.parse({
    front: input.front,
    back: input.back,
    fontFamily: normalizeFont(input.fontFamily),
    textColor: normalizeColor(input.textColor),
  });

  const ok = await updateCardForDeckOwner({
    deckId: input.deckId,
    cardId: input.cardId,
    clerkUserId: userId,
    front: parsed.front,
    back: parsed.back,
    fontFamily: parsed.fontFamily,
    textColor: parsed.textColor,
  });

  if (!ok) {
    throw new Error("Card not found or access denied");
  }

  revalidatePath(`/dashboard/decks/${input.deckId}`);
}

const deleteCardSchema = z.object({
  deckId: z.number().int().positive(),
  cardId: z.number().int().positive(),
});

export type DeleteCardInput = {
  deckId: number;
  cardId: number;
};

export async function deleteCard(input: DeleteCardInput) {
  const { userId } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const parsed = deleteCardSchema.parse({
    deckId: input.deckId,
    cardId: input.cardId,
  });

  const ok = await deleteCardForDeckOwner({
    deckId: parsed.deckId,
    cardId: parsed.cardId,
    clerkUserId: userId,
  });

  if (!ok) {
    throw new Error("Card not found or access denied");
  }

  revalidatePath(`/dashboard/decks/${parsed.deckId}`);
}
