"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateDeck } from "@/app/dashboard/decks/[deckId]/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DeckMetadataEditorProps = {
  deckId: number;
  initialTitle: string;
  initialDescription: string | null;
};

export function DeckMetadataEditor({
  deckId,
  initialTitle,
  initialDescription,
}: DeckMetadataEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
      setTitle(initialTitle);
      setDescription(initialDescription ?? "");
    }
  }

  async function submit() {
    setError(null);
    setPending(true);
    try {
      await updateDeck({
        deckId,
        title,
        description,
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm">Edit deck</Button>}
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit deck</DialogTitle>
          <DialogDescription>
            Update the deck title and optional description. These appear on
            the dashboard and at the top of this page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deck-edit-title">Title</Label>
            <Input
              id="deck-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
              maxLength={255}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deck-edit-description">Description</Label>
            <Textarea
              id="deck-edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              rows={4}
              placeholder="Optional"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button disabled={pending} onClick={submit}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
