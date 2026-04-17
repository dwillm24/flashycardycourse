"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDeck } from "@/app/dashboard/decks/[deckId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteDeckDialogProps = {
  deckId: number;
  deckTitle: string;
  cardCount: number;
};

export function DeleteDeckDialog({
  deckId,
  deckTitle,
  cardCount,
}: DeleteDeckDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
    }
  }

  async function confirmDelete() {
    setError(null);
    setPending(true);
    try {
      const result = await deleteDeck({ deckId });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      setOpen(false);
      router.push("/dashboard");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setError(message);
      setPending(false);
    }
  }

  const cardPhrase =
    cardCount === 0
      ? "This deck has no cards."
      : cardCount === 1
        ? "The 1 card in this deck will be permanently removed."
        : `All ${cardCount} cards in this deck will be permanently removed.`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            Delete deck
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete this deck?</DialogTitle>
          <DialogDescription>
            You are about to delete{" "}
            <span className="font-medium text-foreground">{deckTitle}</span>.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{cardPhrase}</p>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={confirmDelete}
          >
            {pending ? "Deleting…" : "Delete deck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
