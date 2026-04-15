"use client";

import { useState } from "react";
import { createCard } from "@/app/dashboard/decks/[deckId]/actions";
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
import { cardTextStyle } from "@/lib/card-appearance";

type DeckAddCardFormProps = {
  deckId: number;
};

const FALLBACK_PICKER = "#0f172a";

export function DeckAddCardForm({ deckId }: DeckAddCardFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [fontKey, setFontKey] = useState("default");
  const [customTextColor, setCustomTextColor] = useState(false);
  const [colorHex, setColorHex] = useState(FALLBACK_PICKER);

  const previewStyle = cardTextStyle({
    fontFamily: fontKey === "default" ? null : fontKey,
    textColor: customTextColor ? colorHex : null,
  });

  function resetFields() {
    setError(null);
    setFront("");
    setBack("");
    setFontKey("default");
    setCustomTextColor(false);
    setColorHex(FALLBACK_PICKER);
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
      await createCard({
        deckId,
        front,
        back,
        fontFamily: fontKey === "default" ? null : fontKey,
        textColor: customTextColor ? colorHex : null,
      });
      resetFields();
      setOpen(false);
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
      <DialogTrigger render={<Button>New Card</Button>} />
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Card</DialogTitle>
          <DialogDescription>
            Front and back are required. Optional font and text color apply in
            the deck view.
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
              <Label htmlFor="new-card-front">Front</Label>
              <Textarea
                id="new-card-front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={4}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-card-back">Back</Label>
              <Textarea
                id="new-card-back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={4}
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-card-font">Font</Label>
              <Select
                value={fontKey}
                onValueChange={(v) => setFontKey(v ?? "default")}
                disabled={pending}
              >
                <SelectTrigger id="new-card-font" className="w-full">
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
            {pending ? "Adding…" : "Add card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
