import { useFirstVisitHint } from "../first-visit/use-first-visit-hint";

/** Keep this hook in the workbench so changing component pages retains dismissal. */
export function useCustomizeHint(enabled: boolean) {
  return useFirstVisitHint("tiraz.customize-hint.v1", enabled);
}
