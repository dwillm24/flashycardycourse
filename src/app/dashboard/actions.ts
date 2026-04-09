"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { decksTable } from "@/db/schema";

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

  const [row] = await db
    .insert(decksTable)
    .values({
      clerkUserId: userId,
      title: parsed.title,
    })
    .returning({ id: decksTable.id });

  if (row == null) {
    throw new Error("Failed to create deck");
  }

  redirect(`/dashboard/decks/${row.id}`);
}
