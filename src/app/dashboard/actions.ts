"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createDeckForUser } from "@/db/queries/decks";

export type CreateDeckInput = {
  title: string;
};

const createDeckInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
});

export async function createDeck(input: CreateDeckInput) {
  const { userId } = await auth();
  if (userId == null) {
    redirect("/");
  }

  const parsed = createDeckInputSchema.parse(input);

  const row = await createDeckForUser({
    clerkUserId: userId,
    title: parsed.title,
  });

  redirect(`/dashboard/decks/${row.id}`);
}
