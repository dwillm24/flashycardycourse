import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DeckWithCardCountRow } from "@/db/queries/decks";

function formatDeckUpdatedAt(updatedAt: Date) {
  return updatedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeckTile({ deck }: { deck: DeckWithCardCountRow }) {
  const updatedAt =
    deck.updatedAt instanceof Date ? deck.updatedAt : new Date(deck.updatedAt);
  const cardCountLabel = `${deck.cardCount} card${deck.cardCount === 1 ? "" : "s"}`;

  return (
    <Link
      href={`/dashboard/decks/${deck.id}`}
      className="group block h-full rounded-xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex h-44 flex-col transition-colors group-hover:bg-muted/40 group-hover:ring-foreground/20">
        <CardHeader className="flex h-full flex-col space-y-3">
          <CardTitle className="line-clamp-2 pr-1">{deck.title}</CardTitle>
          {deck.description ? (
            <CardDescription className="line-clamp-2 flex-1">
              {deck.description}
            </CardDescription>
          ) : (
            <div className="flex-1" />
          )}
          <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
            <span>{cardCountLabel}</span>
            <time dateTime={updatedAt.toISOString()} className="shrink-0 tabular-nums">
              {formatDeckUpdatedAt(updatedAt)}
            </time>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
