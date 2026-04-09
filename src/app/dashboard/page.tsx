import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { CreateDeckButton } from "@/components/create-deck-button";
import { DeckTile } from "@/components/deck-tile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { decksTable } from "@/db/schema";

export const metadata = {
  title: "Dashboard | FlashyCardy",
  description: "Manage your flashcards and decks",
};

export default async function DashboardPage() {
  const { userId } = await auth();

  const decks =
    userId != null
      ? await db
          .select()
          .from(decksTable)
          .where(eq(decksTable.clerkUserId, userId))
          .orderBy(desc(decksTable.updatedAt))
      : [];

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <Card className="border-0 bg-transparent shadow-none ring-0">
          <CardHeader className="gap-1 px-0">
            <CardTitle
              className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
              role="heading"
              aria-level={1}
            >
              Dashboard
            </CardTitle>
            <CardDescription className="text-base">
              {userId
                ? "Open a deck to study or edit its cards."
                : "Sign in to access your personal dashboard."}
            </CardDescription>
          </CardHeader>
        </Card>

        {!userId && (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Back to home
          </Button>
        )}

        {userId && decks.length === 0 && (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-10 text-center">
              <CardDescription>
                You don&apos;t have any decks yet. Create one below to get
                started.
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {userId && decks.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <li key={deck.id}>
                <DeckTile deck={deck} />
              </li>
            ))}
          </ul>
        )}

        {userId ? (
          <div className="flex justify-center pt-4 sm:justify-start">
            <CreateDeckButton />
          </div>
        ) : null}
      </div>
    </main>
  );
}
