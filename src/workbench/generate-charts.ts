import chartSource from "../system/ai/examples/ChartExamples.tsx?raw";
import type { ChartModel } from "./model";
import type { SystemConfig } from "../system";
import type { Language } from "./i18n";
export function generateChartCode(
  component: string,
  model: ChartModel,
  config: SystemConfig,
  language: Language,
) {
  const source = chartSource.replace(/^import[\s\S]*?;\n/gm, "");
  return `import { useState } from "react";
import { LineChart, AreaChart, BarChart, DonutChart, Card, CardHeader, CardTitle, CardDescription, CardContent, Field, Select, SystemProvider, defaultConfig } from "./system";
import type { ChartDatum, ChartSeries, DonutDatum } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
// Host dependencies: Recharts 3.10.1 and react-is matching React (verified React 19.3.0).
${source}
export default function Example() {
  return <div lang={${JSON.stringify(language)}}><SystemProvider config={{ ...defaultConfig, ...${JSON.stringify(config)} }}><ChartExample language={${JSON.stringify(language)}} kind={${JSON.stringify(component.replace("-chart", ""))}} sample={${JSON.stringify(model.sample)}} legend={${model.legend}} grid={${model.grid}} /><AnalyticsExample language={${JSON.stringify(language)}} /></SystemProvider></div>;
}
`;
}
