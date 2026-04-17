import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DeckStudySession } from "../../../../components/deck-study-session";
import { Button } from "@/components/ui/button";
import { listCardsForDeckOwner } from "@/db/queries/cards";
import { getDeckForOwner } from "@/db/queries/decks";

type PageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function DeckStudyPage({ params }: PageProps) {
  const { deckId } = await params;
  const id = Number(deckId);
  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const deck = await getDeckForOwner({ deckId: id, clerkUserId: userId });
  if (!deck) {
    notFound();
  }

  const cards = await listCardsForDeckOwner({ deckId: id, clerkUserId: userId });

  const studyCards = cards.map((card) => ({
    id: card.id,
    front: card.front,
    back: card.back,
    fontFamily: card.fontFamily,
    textColor: card.textColor,
  }));

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Study: {deck.title}
            </h1>
            {deck.description ? (
              <p className="text-muted-foreground">{deck.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/dashboard/decks/${id}`} />}
            >
              Back to deck
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
          </div>
        </div>

        <DeckStudySession deckId={id} deckTitle={deck.title} cards={studyCards} />
      </div>
    </main>
  );
}

