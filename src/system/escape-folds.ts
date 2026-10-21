import { createContext } from "react";

/**
 * True inside a Decision inbox row, where Escape folds the row and records
 * nothing (Plan 5 Decision 5). DecisionBar then registers no Escape shortcut
 * and shows neither its key hint nor its description. It lives in a .ts file
 * because a context exported from a .tsx file trips only-export-components.
 */
export const EscapeFoldsContext = createContext(false);
