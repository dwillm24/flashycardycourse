import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { decksTable } from "@/db/schema";

type PageProps = {
  params: Promise<{ deckId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { deckId } = await params;
  const id = Number(deckId);
  if (!Number.isInteger(id) || id < 1) {
    return { title: "Deck | FlashyCardy" };
  }
  const { userId } = await auth();
  if (!userId) {
    return { title: "Deck | FlashyCardy" };
  }
  const [deck] = await db
    .select({ title: decksTable.title })
    .from(decksTable)
    .where(and(eq(decksTable.id, id), eq(decksTable.clerkUserId, userId)))
    .limit(1);
  return {
    title: deck ? `${deck.title} | FlashyCardy` : "Deck | FlashyCardy",
  };
}

export default async function DeckPage({ params }: PageProps) {
  const { deckId } = await params;
  const id = Number(deckId);
  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const [deck] = await db
    .select()
    .from(decksTable)
    .where(and(eq(decksTable.id, id), eq(decksTable.clerkUserId, userId)))
    .limit(1);

  if (!deck) {
    notFound();
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{deck.title}</h1>
        {deck.description ? (
          <p className="text-muted-foreground">{deck.description}</p>
        ) : null}
        <p className="text-sm text-muted-foreground pt-4">
          Card list and study tools can be added here.
        </p>
      </div>
    </main>
  );
}
