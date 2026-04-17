"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDeck } from "@/app/dashboard/actions";
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

export function CreateDeckButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function resetFields() {
    setError(null);
    setTitle("");
    setDescription("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      resetFields();
    }
  }

  async function submit() {
    setError(null);
    setPending(true);
    try {
      const result = await createDeck({ title, description });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      resetFields();
      setOpen(false);
      router.push(`/dashboard/decks/${result.deckId}`);
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
        render={
          <Button>
            <Plus data-icon="inline-start" aria-hidden />
            Create New Deck
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New deck</DialogTitle>
          <DialogDescription>
            Enter a title and optional description. You can edit these later
            from the deck page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-deck-title">Title</Label>
            <Input
              id="create-deck-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
              maxLength={255}
              autoComplete="off"
              placeholder="e.g. Spanish verbs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-deck-description">Description</Label>
            <Textarea
              id="create-deck-description"
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
            {pending ? "Creating…" : "Create deck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
