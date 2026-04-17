import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DeckAddCardForm } from "@/components/deck-add-card-form";
import { DeckCardEditor } from "@/components/deck-card-editor";
import { DeckMetadataEditor } from "@/components/deck-metadata-editor";
import { DeleteDeckDialog } from "@/components/delete-deck-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCardsForDeckOwner } from "@/db/queries/cards";
import { getDeckForOwner, getDeckTitleForOwner } from "@/db/queries/decks";

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
  const title = await getDeckTitleForOwner({ deckId: id, clerkUserId: userId });
  return {
    title: title ? `${title} | FlashyCardy` : "Deck | FlashyCardy",
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

  const deck = await getDeckForOwner({ deckId: id, clerkUserId: userId });

  if (!deck) {
    notFound();
  }

  const cards = await listCardsForDeckOwner({
    deckId: id,
    clerkUserId: userId,
  });

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {deck.title}
              </h1>
              <DeckMetadataEditor
                deckId={id}
                initialTitle={deck.title}
                initialDescription={deck.description}
              />
              <DeleteDeckDialog
                deckId={id}
                deckTitle={deck.title}
                cardCount={cards.length}
              />
            </div>
            {deck.description ? (
              <p className="text-muted-foreground">{deck.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Back to dashboard
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {cards.length > 0 ? (
            <Button
              nativeButton={false}
              render={<Link href={`/decks/${id}/study`} />}
            >
              Start study session
            </Button>
          ) : (
            <Button disabled>Start study session</Button>
          )}
        </div>

        <section className="space-y-4" aria-label="Cards in this deck">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Cards ({cards.length})
            </h2>
            <div className="flex shrink-0 sm:justify-end">
              <DeckAddCardForm deckId={id} />
            </div>
          </div>

          {cards.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">No cards yet</CardTitle>
                <CardDescription>
                  Use{" "}
                  <span className="font-medium text-foreground">New Card</span>{" "}
                  to open the form. You can set a custom font and text color for
                  each card.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-6">
              {cards.map((card) => (
                <li key={card.id}>
                  <DeckCardEditor deckId={id} card={card} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
