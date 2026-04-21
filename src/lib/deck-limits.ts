/**
 * Clerk Billing deck caps — see `.cursor/rules/clerk-billing.mdc`.
 * Free plan: `3_deck_limit`; Pro: `unlimited_decks`.
 */
export function isDeckCreationBlocked(
  has: (params: { feature: string }) => boolean,
  deckCount: number
): boolean {
  if (has({ feature: "unlimited_decks" })) {
    return false;
  }
  return has({ feature: "3_deck_limit" }) && deckCount >= 3;
}
