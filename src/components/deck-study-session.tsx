"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressValue } from "@/components/ui/progress";

type StudyCard = {
  id: number;
  front: string;
  back: string;
  fontFamily: string | null;
  textColor: string | null;
};

type CardResult = "correct" | "incorrect";

function shuffle<T>(input: T[]) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function DeckStudySession(props: {
  deckId: number;
  deckTitle: string;
  cards: StudyCard[];
}) {
  const { deckId, deckTitle, cards } = props;
  const [order, setOrder] = React.useState<number[]>(
    () => cards.map((c) => c.id)
  );
  const [idx, setIdx] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [results, setResults] = React.useState<Record<number, CardResult>>({});

  const cardsById = React.useMemo(() => {
    return new Map(cards.map((c) => [c.id, c]));
  }, [cards]);

  const total = order.length;
  const currentId = total > 0 ? order[Math.min(idx, total - 1)] : undefined;
  const current = currentId != null ? cardsById.get(currentId) : undefined;
  const progressValue = total > 0 ? ((Math.min(idx + 1, total) / total) * 100) : 0;
  const currentResult: CardResult | undefined =
    currentId != null ? results[currentId] : undefined;

  const correctCount = React.useMemo(() => {
    let n = 0;
    for (const id of order) if (results[id] === "correct") n += 1;
    return n;
  }, [order, results]);

  const incorrectCount = React.useMemo(() => {
    let n = 0;
    for (const id of order) if (results[id] === "incorrect") n += 1;
    return n;
  }, [order, results]);

  const answeredCount = correctCount + incorrectCount;
  const remainingCount = Math.max(0, total - answeredCount);
  const isComplete = total > 0 && answeredCount >= total;
  const accuracyPct = total > 0 ? (correctCount / total) * 100 : 0;

  React.useEffect(() => {
    setOrder(cards.map((c) => c.id));
    setIdx(0);
    setIsFlipped(false);
    setResults({});
  }, [cards]);

  const canGoPrev = idx > 0;
  const canGoNext = idx < total - 1;

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (target?.isContentEditable) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsFlipped((v) => !v);
        return;
      }

      if (e.key === "ArrowRight") {
        if (!canGoNext) return;
        setIdx((v) => v + 1);
        setIsFlipped(false);
        return;
      }

      if (e.key === "ArrowLeft") {
        if (!canGoPrev) return;
        setIdx((v) => v - 1);
        setIsFlipped(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoNext, canGoPrev]);

  if (cards.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">No cards to study</CardTitle>
          <CardDescription>
            Add at least one card to this deck, then come back here to study.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end gap-2">
          <Button nativeButton={false} render={<Link href={`/dashboard/decks/${deckId}`} />}>
            Go to deck
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">Session complete</CardTitle>
          <CardDescription className="min-w-0">
            You finished studying <span className="font-medium">{deckTitle}</span>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Correct</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {correctCount}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Incorrect</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {incorrectCount}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {Math.round(accuracyPct)}%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Accuracy</span>
              <span className="tabular-nums">
                {correctCount} / {total}
              </span>
            </div>
            <Progress value={accuracyPct} aria-label="Accuracy">
              <ProgressValue />
            </Progress>
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOrder(cards.map((c) => c.id));
              setIdx(0);
              setIsFlipped(false);
              setResults({});
            }}
          >
            Study again
          </Button>
          <Button nativeButton={false} render={<Link href={`/dashboard/decks/${deckId}`} />}>
            Go to deck
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{deckTitle}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <CardDescription className="tabular-nums">
              Card {Math.min(idx + 1, total)} of {total}
            </CardDescription>
            {currentResult === "correct" ? (
              <Badge variant="secondary">Correct</Badge>
            ) : currentResult === "incorrect" ? (
              <Badge variant="destructive">Incorrect</Badge>
            ) : (
              <Badge variant="outline">Unanswered</Badge>
            )}
          </div>
        </div>
        <Progress value={progressValue} aria-label="Study progress">
          <ProgressValue />
        </Progress>
        <CardDescription className="tabular-nums">
          Correct {correctCount} • Incorrect {incorrectCount} • Remaining {remainingCount}
        </CardDescription>
        <CardDescription>
          {isFlipped ? "Back side" : "Front side"} — use Flip to reveal the{" "}
          {isFlipped ? "front" : "back"}.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div
          className="flex min-h-[240px] cursor-pointer items-center justify-center rounded-lg bg-muted/30 px-4 py-10 text-center"
          role="button"
          tabIndex={0}
          onClick={() => setIsFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsFlipped((v) => !v);
            if (e.key === "ArrowRight" && canGoNext) {
              setIdx((v) => v + 1);
              setIsFlipped(false);
            }
            if (e.key === "ArrowLeft" && canGoPrev) {
              setIdx((v) => v - 1);
              setIsFlipped(false);
            }
          }}
          aria-label="Flashcard. Click to flip."
        >
          <div
            className="w-full max-w-2xl whitespace-pre-wrap break-words text-lg leading-relaxed sm:text-xl"
            style={{
              fontFamily: current?.fontFamily ?? undefined,
              color: current?.textColor ?? undefined,
            }}
          >
            {isFlipped ? current?.back : current?.front}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <div className="flex w-full flex-wrap gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setIsFlipped((v) => !v);
            }}
          >
            Flip
          </Button>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            size="lg"
            className="w-full"
            variant={currentResult === "correct" ? "default" : "secondary"}
            onClick={() => {
              if (currentId == null) return;
              setResults((prev) => ({ ...prev, [currentId]: "correct" }));
              if (canGoNext) setIdx((v) => v + 1);
              setIsFlipped(false);
            }}
          >
            Correct
          </Button>
          <Button
            size="lg"
            className="w-full"
            variant={currentResult === "incorrect" ? "destructive" : "outline"}
            onClick={() => {
              if (currentId == null) return;
              setResults((prev) => ({ ...prev, [currentId]: "incorrect" }));
              if (canGoNext) setIdx((v) => v + 1);
              setIsFlipped(false);
            }}
          >
            Incorrect
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!canGoPrev}
            onClick={() => {
              setIdx((v) => Math.max(0, v - 1));
              setIsFlipped(false);
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!canGoNext}
            onClick={() => {
              setIdx((v) => Math.min(total - 1, v + 1));
              setIsFlipped(false);
            }}
          >
            Next
          </Button>
        </div>

        <div className="flex w-full flex-wrap gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setOrder((prev) => shuffle(prev));
              setIdx(0);
              setIsFlipped(false);
              setResults({});
            }}
          >
            Shuffle
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => {
              setOrder(cards.map((c) => c.id));
              setIdx(0);
              setIsFlipped(false);
              setResults({});
            }}
          >
            Restart
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

