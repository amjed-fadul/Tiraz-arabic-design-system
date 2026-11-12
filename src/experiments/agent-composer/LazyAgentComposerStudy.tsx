import { lazy } from "react";

export const LazyAgentComposerStudy = lazy(() =>
  import("./AgentComposerStudy").then((module) => ({
    default: module.AgentComposerStudy,
  })),
);
