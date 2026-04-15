import type { CSSProperties } from "react";

export const CARD_FONT_OPTIONS = ["sans", "serif", "mono"] as const;
export type CardFontOption = (typeof CARD_FONT_OPTIONS)[number];

const FONT_STACK: Record<CardFontOption, string> = {
  sans:
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

export function isCardFontOption(value: string | null): value is CardFontOption {
  return value != null && CARD_FONT_OPTIONS.includes(value as CardFontOption);
}

/** Inline styles applied to card preview text (front + back). */
export function cardTextStyle(input: {
  fontFamily: string | null;
  textColor: string | null;
}): CSSProperties {
  const style: CSSProperties = {};
  if (isCardFontOption(input.fontFamily)) {
    style.fontFamily = FONT_STACK[input.fontFamily];
  }
  if (
    input.textColor != null &&
    /^#[0-9A-Fa-f]{6}$/.test(input.textColor)
  ) {
    style.color = input.textColor;
  }
  return style;
}
