import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { decksTable } from "@/db/schema";

type DeckRow = typeof decksTable.$inferSelect;

function formatDeckCreatedAt(createdAt: Date) {
  return createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeckTile({ deck }: { deck: DeckRow }) {
  const createdAt =
    deck.createdAt instanceof Date ? deck.createdAt : new Date(deck.createdAt);

  return (
    <Link
      href={`/dashboard/decks/${deck.id}`}
      className="group block rounded-xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full transition-colors group-hover:bg-muted/40 group-hover:ring-foreground/20">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 pr-1">{deck.title}</CardTitle>
            <time
              dateTime={createdAt.toISOString()}
              className="text-muted-foreground shrink-0 text-xs tabular-nums"
            >
              {formatDeckCreatedAt(createdAt)}
            </time>
          </div>
          {deck.description ? (
            <CardDescription className="line-clamp-2">
              {deck.description}
            </CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
