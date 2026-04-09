"use client";

import { Plus } from "lucide-react";
import { useTransition } from "react";
import { createDeck } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

const NEW_DECK_TITLE = "New deck";

export function CreateDeckButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(() => createDeck({ title: NEW_DECK_TITLE }))
      }
    >
      <Plus data-icon="inline-start" aria-hidden />
      {pending ? "Creating…" : "Create New Deck"}
    </Button>
  );
}
