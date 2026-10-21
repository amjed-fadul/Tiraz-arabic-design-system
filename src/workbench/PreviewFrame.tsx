import type { ComponentProps, ReactNode } from "react";
import { DemoFrame } from "../system/ai/examples/DemoFrame";
import type { Language } from "./i18n";
export function PreviewFrame({
  language,
  code,
  onReplay,
  replayable,
  children,
  ...frame
}: {
  language: Language;
  code: string;
  onReplay: () => void;
  replayable: boolean;
  children: ReactNode;
} & Pick<
  ComponentProps<typeof DemoFrame>,
  | "states"
  | "state"
  | "onStateChange"
  | "openHref"
  | "onViewChange"
  | "replaying"
>) {
  return (
    <DemoFrame
      language={language}
      code={code}
      onReplay={replayable ? onReplay : undefined}
      {...frame}
    >
      {children}
    </DemoFrame>
  );
}
