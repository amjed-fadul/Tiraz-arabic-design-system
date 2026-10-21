import { createContext, useContext } from "react";

type Phase = "typing" | "sending" | "working" | "complete";
export interface ScreenDemoState {
  submitted: boolean;
  phase: Phase;
  active: boolean;
  automatic: boolean;
  paused: boolean;
  progress: number;
  step: number;
  draft: (text: string) => string;
  stop: () => void;
  toggle: () => void;
  replay: () => void;
}

export const ScreenDemoContext = createContext<ScreenDemoState | null>(null);

export function useScreenDemo() {
  const demo = useContext(ScreenDemoContext);
  if (!demo) throw new Error("useScreenDemo needs ScreenDemoProvider.");
  return demo;
}
