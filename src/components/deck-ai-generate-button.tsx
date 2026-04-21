"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateDeckCardsWithAi } from "@/app/dashboard/decks/[deckId]/actions";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DeckAiGenerateAvailability =
  | "billing"
  | "needs_title"
  | "needs_description"
  | "ready";

type DeckAiGenerateButtonProps = {
  deckId: number;
  availability: DeckAiGenerateAvailability;
};

export function DeckAiGenerateButton({
  deckId,
  availability,
}: DeckAiGenerateButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setPending(true);
    try {
      const result = await generateDeckCardsWithAi({ deckId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Try again."
      );
    } finally {
      setPending(false);
    }
  }

  if (availability === "billing") {
    return (
      <div className="flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger
            delay={200}
            render={
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/pricing" />}
              />
            }
          >
            Generate cards with AI
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-pretty">
            AI flashcard generation is a paid feature. Click to view pricing and
            upgrade your plan.
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (availability === "needs_description") {
    return (
      <div className="flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger
            delay={200}
            render={<span className="inline-flex cursor-default" />}
          >
            <Button type="button" variant="outline" disabled>
              Generate cards with AI
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-pretty">
            This button is disabled because this deck has no description yet. Click
            Edit deck, add a description, save, and try again.
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (availability === "needs_title") {
    return (
      <div className="flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger
            delay={200}
            render={<span className="inline-flex cursor-default" />}
          >
            <Button type="button" variant="outline" disabled>
              Generate cards with AI
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-pretty">
            This button is disabled because the deck title is empty. Click Edit deck,
            add a title, save, and try again.
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={handleGenerate}
      >
        {pending ? "Generating…" : "Generate cards with AI"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
