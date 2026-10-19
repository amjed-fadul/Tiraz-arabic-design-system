import type { ComponentId } from "./catalog";
import type { Localized } from "./i18n";

/**
 * The notes row under a page's example. `instead` names another page where
 * one fits better; the frame links it by that page's name.
 */
export interface PageNotes {
  useWhen: readonly Localized[];
  instead?: readonly { text: Localized; page?: ComponentId }[];
  notice?: readonly Localized[];
}

// A page without notes shows no notes row.
export const docsNotes: Partial<Record<ComponentId, PageNotes>> = {};
