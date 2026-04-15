"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCard, updateCard } from "@/app/dashboard/decks/[deckId]/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CardRow } from "@/db/queries/cards";
import { cardTextStyle, isCardFontOption } from "@/lib/card-appearance";

type DeckCardEditorProps = {
  deckId: number;
  card: CardRow;
};

const FALLBACK_PICKER = "#0f172a";

function initialFontSelectValue(fontFamily: string | null): string {
  if (isCardFontOption(fontFamily)) {
    return fontFamily;
  }
  return "default";
}

export function DeckCardEditor({ deckId, card }: DeckCardEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [fontKey, setFontKey] = useState(() =>
    initialFontSelectValue(card.fontFamily)
  );
  const [customTextColor, setCustomTextColor] = useState(
    card.textColor != null
  );
  const [colorHex, setColorHex] = useState(card.textColor ?? FALLBACK_PICKER);

  const readOnlyStyle = cardTextStyle({
    fontFamily: card.fontFamily,
    textColor: card.textColor,
  });

  const previewStyle = cardTextStyle({
    fontFamily: fontKey === "default" ? null : fontKey,
    textColor: customTextColor ? colorHex : null,
  });

  const frontLabel = card.front.trim() || "Untitled";

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
      setFront(card.front);
      setBack(card.back);
      setFontKey(initialFontSelectValue(card.fontFamily));
      const hasCustom = card.textColor != null;
      setCustomTextColor(hasCustom);
      setColorHex(card.textColor ?? FALLBACK_PICKER);
    }
  }

  async function submit() {
    setError(null);
    setPending(true);
    try {
      await updateCard({
        deckId,
        cardId: card.id,
        front,
        back,
        fontFamily: fontKey === "default" ? null : fontKey,
        textColor: customTextColor ? colorHex : null,
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

  async function confirmDelete() {
    setDeleteError(null);
    setDeletePending(true);
    try {
      await deleteCard({ deckId, cardId: card.id });
      setDeleteOpen(false);
      router.refresh();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setDeleteError(message);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-end">
        <div className="flex flex-wrap justify-end gap-2">
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Edit card #{card.id}</DialogTitle>
                <DialogDescription>
                  Change the text and appearance for this card. Save to apply.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Preview — front
                    </p>
                    <p className="text-sm whitespace-pre-wrap" style={previewStyle}>
                      {front || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Preview — back
                    </p>
                    <p className="text-sm whitespace-pre-wrap" style={previewStyle}>
                      {back || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`card-${card.id}-front`}>Front</Label>
                    <Textarea
                      id={`card-${card.id}-front`}
                      value={front}
                      onChange={(e) => setFront(e.target.value)}
                      rows={4}
                      disabled={pending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`card-${card.id}-back`}>Back</Label>
                    <Textarea
                      id={`card-${card.id}-back`}
                      value={back}
                      onChange={(e) => setBack(e.target.value)}
                      rows={4}
                      disabled={pending}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`card-${card.id}-font`}>Font</Label>
                    <Select
                      value={fontKey}
                      onValueChange={(v) => setFontKey(v ?? "default")}
                      disabled={pending}
                    >
                      <SelectTrigger id={`card-${card.id}-font`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Theme default</SelectItem>
                        <SelectItem value="sans">Sans</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="mono">Monospace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Text color</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="color"
                        className="h-8 w-14 shrink-0 cursor-pointer p-1"
                        value={colorHex}
                        onChange={(e) => {
                          setColorHex(e.target.value);
                          setCustomTextColor(true);
                        }}
                        disabled={pending || !customTextColor}
                        aria-label="Text color"
                      />
                      <Button
                        type="button"
                        variant={customTextColor ? "outline" : "secondary"}
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          if (customTextColor) {
                            setCustomTextColor(false);
                          } else {
                            setCustomTextColor(true);
                          }
                        }}
                      >
                        {customTextColor ? "Use theme color" : "Custom color"}
                      </Button>
                    </div>
                  </div>
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
                  {pending ? "Saving…" : "Save card"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={deleteOpen}
            onOpenChange={(next) => {
              setDeleteOpen(next);
              if (next) setDeleteError(null);
            }}
          >
            <DialogTrigger
              render={
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete card {frontLabel}?</DialogTitle>
                <DialogDescription>
                  This permanently removes the card from this deck. This action
                  can’t be undone.
                </DialogDescription>
              </DialogHeader>

              {deleteError ? (
                <p className="text-sm text-destructive" role="alert">
                  {deleteError}
                </p>
              ) : null}

              <DialogFooter>
                <DialogClose
                  render={
                    <Button variant="outline" disabled={deletePending} />
                  }
                >
                  Cancel
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={deletePending}
                  onClick={confirmDelete}
                >
                  {deletePending ? "Deleting…" : "Delete card"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Front
            </p>
            <p className="text-sm whitespace-pre-wrap" style={readOnlyStyle}>
              {card.front || "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Back
            </p>
            <p className="text-sm whitespace-pre-wrap" style={readOnlyStyle}>
              {card.back || "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
