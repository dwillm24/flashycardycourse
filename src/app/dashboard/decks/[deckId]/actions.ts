"use server";

import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createCardForDeckOwner,
  createCardsBatchForDeckOwner,
  deleteCardForDeckOwner,
  updateCardForDeckOwner,
} from "@/db/queries/cards";
import { deleteDeckForOwner, getDeckForOwner, updateDeckForOwner } from "@/db/queries/decks";
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

const AI_DECK_CARD_COUNT = 20;

const generateDeckCardsInputSchema = z.object({
  deckId: z.number().int().positive(),
});

const aiGeneratedCardRowSchema = z.object({
  front: z.string().trim().min(1).max(20_000),
  back: z.string().trim().min(1).max(20_000),
});

export type GenerateDeckCardsWithAiResult =
  | { ok: true; inserted: number }
  | { ok: false; error: string };

export async function generateDeckCardsWithAi(
  input: unknown
): Promise<GenerateDeckCardsWithAiResult> {
  const { userId, has } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const canUseAi =
    has({ plan: "pro" }) || has({ feature: "ai_flashcard_generation" });
  if (!canUseAi) {
    return {
      ok: false,
      error:
        "AI flashcard generation is not available on your plan. Upgrade to use this feature.",
    };
  }

  const parsed = generateDeckCardsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const deckId = parsed.data.deckId;

  const deck = await getDeckForOwner({ deckId, clerkUserId: userId });
  if (deck == null) {
    return { ok: false, error: "Deck not found or access denied." };
  }

  const trimmedTitle = deck.title.trim();
  if (trimmedTitle.length === 0) {
    return {
      ok: false,
      error:
        "Add a deck title before using AI generation. Click Edit deck, add a title, then save.",
    };
  }

  const trimmedDescription = deck.description?.trim() ?? "";
  if (trimmedDescription.length === 0) {
    return {
      ok: false,
      error:
        "Add a deck description before using AI generation. Click Edit deck, add a description, then save.",
    };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      ok: false,
      error:
        "AI generation is not configured on the server (missing OPENAI_API_KEY).",
    };
  }

  const flashcardsOutputSchema = z.object({
    cards: z
      .array(
        z.object({
          front: z.string(),
          back: z.string(),
        })
      )
      .length(AI_DECK_CARD_COUNT),
  });

  try {
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({
        schema: flashcardsOutputSchema,
        name: "flashcards",
        description: `Exactly ${AI_DECK_CARD_COUNT} flashcards with front and back fields.`,
      }),
      prompt: `You are creating study flashcards for a deck.

Deck title: ${trimmedTitle}
Deck description: ${trimmedDescription}

Step 1 — Decide the deck type from the title and description alone:
- **Language-learning deck:** the user is learning vocabulary or phrases in another language (translation practice, bilingual study, e.g. English to Indonesian, "Learning Spanish", beginner phrases, etc.).
- **General deck:** everything else (history, science, concepts, trivia, procedures, etc.).

Step 2 — Follow the matching rules exactly.

---

### If this is a language-learning / translation deck

Use **minimal translation pairs** only. Do **not** use quiz-style fronts such as "What is 'Hello' in Indonesian?" or "How do you say …?".

- **front:** Only a **word, short phrase, or natural sentence in the base/source language** (infer it from the deck title and description—for example English when the deck is English → Indonesian or "from English to Indonesian").
- **back:** Only the **direct translation** of that exact front text into the **target language**. No definitions, etymology, grammar notes, extra examples, or filler—unless the deck description explicitly asks for that kind of detail.
- Keep both sides compact (usually a few words up to one short sentence per side).
- Vary vocabulary and phrases; do not repeat the same front twice.

---

### If this is a general (non-language) deck

- **front:** a concise question, term, or recall cue.
- **back:** a clear, accurate answer or brief explanation.

---

### For every deck

Generate exactly ${AI_DECK_CARD_COUNT} distinct cards. Each side must stand alone (no "see above" or references to other cards). Cover the deck topic evenly.`,
    });

    if (output?.cards == null) {
      return {
        ok: false,
        error: "The model did not return flashcards. Please try again.",
      };
    }

    const normalized = output.cards.map((card) =>
      aiGeneratedCardRowSchema.parse({
        front: card.front,
        back: card.back,
      })
    );

    const batch = await createCardsBatchForDeckOwner({
      deckId,
      clerkUserId: userId,
      cards: normalized,
    });

    if (batch == null) {
      return { ok: false, error: "Deck not found or access denied." };
    }

    revalidatePath(`/dashboard/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/study`);

    return { ok: true, inserted: batch.inserted };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Something went wrong during AI generation.";
    return { ok: false, error: message };
  }
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
