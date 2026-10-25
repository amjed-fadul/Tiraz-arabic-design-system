import agentPreviewSource from "./agent-preview.ts?raw";
import playgroundAgentSource from "./playground-agent.tsx?raw";
import { isAgentPreview, agentIdentityHeaders } from "./agent-preview";
import localResponseSource from "../system/ai/examples/useLocalResponse.ts?raw";
import agentTaskSource from "../system/ai/examples/AgentTaskExamples.tsx?raw";
import taskStarterSource from "../system/ai/examples/TaskStarterExamples.tsx?raw";
import suggestedEditsSource from "../system/ai/examples/SuggestedEditsExamples.tsx?raw";
import imageGenerationSource from "../system/ai/examples/ImageGenerationExamples.tsx?raw";
import draftReviewSource from "../system/ai/examples/DraftReviewExamples.tsx?raw";
import changeSummarySource from "../system/ai/examples/ChangeSummaryExamples.tsx?raw";
import assistantControlsSource from "../system/ai/examples/AssistantControlsExamples.tsx?raw";
import citedAnswerSource from "../system/ai/examples/CitedAnswerExamples.tsx?raw";
import dataAnswerSource from "../system/ai/examples/DataAnswerExamples.tsx?raw";
import decisionInboxSource from "../system/ai/examples/DecisionInboxExamples.tsx?raw";
import terminalSource from "../system/ai/examples/TerminalExamples.tsx?raw";
import chatAppSource from "../system/ai/examples/ChatAppExample.tsx?raw";
import aiDecisionsSource from "../system/ai/examples/AIDecisionsExamples.tsx?raw";
import aiContextSource from "../system/ai/examples/AIContextExamples.tsx?raw";
import aiResultsSource from "../system/ai/examples/AIResultsExamples.tsx?raw";
import chatSource from "../system/ai/examples/ChatExamples.tsx?raw";
import aiContentSource from "../system/ai/examples/AIContentExamples.tsx?raw";
import toolActivitySource from "../system/ai/examples/ToolActivityExamples.tsx?raw";
import aiFeedbackSource from "../system/ai/examples/AIFeedbackExamples.tsx?raw";
import fileTreeSource from "../system/ai/examples/FileTreeExamples.tsx?raw";
import taskRowsSource from "../system/ai/examples/TaskRowsExamples.tsx?raw";
import notificationListSource from "../system/ai/examples/NotificationListExamples.tsx?raw";
import stepsSource from "../system/ai/examples/StepsExamples.tsx?raw";
import timelineSource from "../system/ai/examples/TimelineExamples.tsx?raw";
import sliderSource from "../system/ai/examples/SliderExamples.tsx?raw";
import otpSource from "../system/ai/examples/OTPInputExamples.tsx?raw";
import dateSource from "../system/ai/examples/DatePickerExamples.tsx?raw";
import filesSource from "../system/ai/examples/FileDropzoneExamples.tsx?raw";
import colorsSource from "../system/ai/examples/ColorPickerExamples.tsx?raw";
import tagSource from "../system/ai/examples/TagInputExamples.tsx?raw";
import chipSource from "../system/ai/examples/ChipExamples.tsx?raw";
import filterSource from "../system/ai/examples/FilterBarExamples.tsx?raw";
import copySource from "../system/ai/examples/InputCopyExamples.tsx?raw";
import sidebarSource from "../system/ai/examples/SidebarExamples.tsx?raw";
import type { SidebarModel } from "./model";
import { generateChartCode } from "./generate-charts";
import type { ChartModel } from "./model";
import { generateBatchCode } from "./generate-batch";
import customerSource from "../system/ai/examples/CustomerDataTable.tsx?raw";
import createSource from "../system/ai/examples/CreateCustomer.tsx?raw";
import type { DataTableModel } from "./model";
import type { SystemConfig } from "../system";
import type { ComponentId } from "./catalog";
import { catalog, chartIds } from "./catalog";
import { assertNever, isOneOf } from "./exhaustive";
import type {
  BadgeModel,
  CheckboxModel,
  RadioGroupModel,
  TextareaModel,
  FieldModel,
  InputModel,
  SelectModel,
  ButtonModel,
  MenuModel,
  PlaygroundModel,
  SheetModel,
  SwitchModel,
  TabsModel,
  ToastModel,
  TableModel,
} from "./model";
import { nativeAttributes, previewConfig } from "./model";
import type { Language } from "./i18n";
import { localize, words } from "./i18n";
import {
  generateThemeCss,
  normalizeBrandColors,
  withCustomTheme,
} from "./theme-customization";
import type { BrandColors } from "./theme-customization";
const json = (value: unknown) => JSON.stringify(value);
const attribute = (name: string, value: unknown) => `${name}={${json(value)}}`;
function nativeCode(p: ButtonModel | SwitchModel) {
  const extras = nativeAttributes(
    p.attributes,
    "children" in p ? "button" : "switch",
  );
  if ("children" in p && (p.ariaLabel || p.iconOnly))
    delete extras["aria-label"];
  if ("checked" in p) {
    delete extras.name;
    delete extras.value;
  }
  return [
    p.id && attribute("id", p.id),
    p.className && attribute("className", p.className),
    Object.keys(extras).length && `{...${json(extras)}}`,
    p.stylePreset === "wide" && "style={{ minInlineSize: 180 }}",
  ]
    .filter(Boolean)
    .join("\n        ");
}
function generateBaseCode(
  component: ComponentId,
  model: PlaygroundModel,
  config: SystemConfig,
  language: Language,
): string {
  if (component === "terminal" || component === "chat-app") {
    const source = (component === "terminal" ? terminalSource : chatAppSource)
      .replace(/from "\.\.\/\.\.\/index"/g, 'from "./system"')
      .replace(
        /from "\.\/finance-story"/g,
        'from "./system/ai/examples/finance-story"',
      );
    const name =
      component === "terminal" ? "TerminalExample" : "ChatAppExample";
    return `${source}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example(){return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(model)}}/></SystemProvider></div>;}`;
  }
  if (
    isOneOf(component, [
      "task-starter",
      "cited-answer",
      "data-answer",
      "agent-task",
      "decision-inbox",
      "suggested-edits",
      "image-generation",
      "draft-review",
      "change-summary",
      "assistant-controls",
      "ask-user-questions",
      "approval-card",
      "approval-flow",
    ])
  ) {
    const source = (
      component === "task-starter"
        ? taskStarterSource
        : component === "cited-answer"
          ? citedAnswerSource
          : component === "data-answer"
            ? dataAnswerSource
            : component === "agent-task"
              ? agentTaskSource
              : component === "decision-inbox"
                ? decisionInboxSource
                : component === "suggested-edits"
                  ? suggestedEditsSource
                  : component === "image-generation"
                    ? imageGenerationSource
                    : component === "draft-review"
                      ? draftReviewSource
                      : component === "change-summary"
                        ? changeSummarySource
                        : component === "assistant-controls"
                          ? assistantControlsSource
                          : aiDecisionsSource
    )
      .replace(/from "\.\.\/\.\.\/index"/g, 'from "./system"')
      .replace(
        /from "\.\/finance-story"/g,
        'from "./system/ai/examples/finance-story"',
      );
    const name =
      component === "task-starter"
        ? "TaskStarterExample"
        : component === "cited-answer"
          ? "CitedAnswerExample"
          : component === "data-answer"
            ? "DataAnswerExample"
            : component === "agent-task"
              ? "AgentTaskExample"
              : component === "decision-inbox"
                ? "DecisionInboxExample"
                : component === "suggested-edits"
                  ? "SuggestedEditsExample"
                  : component === "image-generation"
                    ? "ImageGenerationExample"
                    : component === "draft-review"
                      ? "DraftReviewExample"
                      : component === "change-summary"
                        ? "ChangeSummaryExample"
                        : component === "assistant-controls"
                          ? "AssistantControlsExample"
                          : component === "ask-user-questions"
                            ? "AskUserQuestionsExample"
                            : component === "approval-card"
                              ? "ApprovalCardExample"
                              : "ApprovalFlowExample";
    const options = model as unknown as Record<string, unknown>;
    const mascot =
      isAgentPreview(component) && options.agentAppearance === "mascot";
    const identitySource = mascot
      ? (agentPreviewSource + "\n" + playgroundAgentSource)
          .replace(
            /import (?:type )?\{[^}]+\} from "\.\/agent-preview";\n/g,
            "",
          )
          .replace(/from "\.\.\/mascot\//g, 'from "./mascot/')
          .replace(/from "\.\.\/system"/g, 'from "./system"')
          .replace(
            /from "\.\.\/system\/ai\/examples\/finance-story"/g,
            'from "./system/ai/examples/finance-story"',
          )
      : "";
    const exampleModel = Object.fromEntries(
      Object.entries(model).filter(
        ([key]) => key !== "agentAppearance" && key !== "agentColor",
      ),
    );
    const identityProp = mascot
      ? ` getAgentPresentation={getPlaygroundAgentPresentation(${json(component)},${json({ agentAppearance: options.agentAppearance, agentColor: options.agentColor })},${json(language)})}`
      : isAgentPreview(component) && agentIdentityHeaders.includes(component)
        ? ` getAgentPresentation={() => ({name:${json(language === "ar" ? "وكيل المالية" : "Finance agent")}})}`
        : "";
    return `${source}
${identitySource}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example(){return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(exampleModel)}}${identityProp}/></SystemProvider></div>;}`;
  }
  if (
    isOneOf(component, ["selection-actions", "context-meter", "model-selector"])
  ) {
    const source = aiContextSource.replace(
      /from "\.\.\/\.\.\/index"/g,
      'from "./system"',
    );
    const name =
      component === "selection-actions"
        ? "SelectionActionsExample"
        : component === "context-meter"
          ? "ContextMeterExample"
          : "ModelSelectorExample";
    return `${source}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example(){return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(model)}}/></SystemProvider></div>;}`;
  }
  if (isOneOf(component, ["image-result", "sources", "insight-cards"])) {
    const source = aiResultsSource
      .replace(/from "\.\.\/\.\.\/index"/g, 'from "./system"')
      .replaceAll(
        'from "../assets/results/',
        'from "./system/ai/assets/results/',
      )
      .replace(
        'from "./ai-result-samples"',
        'from "./system/ai/examples/ai-result-samples"',
      );
    const name =
      component === "image-result"
        ? "ImageResultExample"
        : component === "sources"
          ? "SourcesExample"
          : "InsightCardsExample";
    return `// Copy the whole system/ai/assets/results directory. Preserve local SVG and text ?url&no-inline imports.
${source}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example(){return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(model)}}/></SystemProvider></div>;}`;
  }
  if (isOneOf(component, ["chat-thread", "chat-composer", "prompt-bar"])) {
    const source = chatSource
      .replace(
        'import { useLocalResponse } from "./useLocalResponse";',
        localResponseSource,
      )
      .replace(/from "\.\.\/\.\.\/index"/g, 'from "./system"');
    const name =
      component === "chat-thread"
        ? "ChatThreadExample"
        : component === "chat-composer"
          ? "ChatComposerExample"
          : "PromptBarExample";
    return `${source}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example(){return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(model)}}/></SystemProvider></div>;}`;
  }
  if (isOneOf(component, ["code-block", "markdown", "streaming-text"])) {
    const source = aiContentSource
      .replace(/from "\.\.\/\.\.\/index"/g, 'from "./system"')
      .replace('from "./DemoFrame"', 'from "./system/ai/examples/DemoFrame"');
    const name =
      component === "code-block"
        ? "CodeBlockExample"
        : component === "markdown"
          ? "MarkdownExample"
          : "StreamingTextExample";
    return `// Dependencies: npm install react-markdown@10.1.0 remark-gfm@4.0.1
${source}
import {SystemProvider,defaultConfig} from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example(){return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(model)}}/></SystemProvider></div>;}`;
  }
  if (
    component === "tool-call" ||
    component === "tool-chips" ||
    component === "loading-state" ||
    component === "thinking-indicator" ||
    component === "thinking-state" ||
    component === "file-tree" ||
    component === "steps" ||
    component === "timeline" ||
    component === "task-rows" ||
    component === "notification-list"
  ) {
    const source = (
      component === "tool-call" || component === "tool-chips"
        ? toolActivitySource
        : ["loading-state", "thinking-indicator", "thinking-state"].includes(
              component,
            )
          ? aiFeedbackSource
          : component === "file-tree"
            ? fileTreeSource
            : component === "task-rows"
              ? taskRowsSource
              : component === "notification-list"
                ? notificationListSource
                : component === "steps"
                  ? stepsSource
                  : timelineSource
    ).replace(/from "\.\.\/\.\.\/index"/g, 'from "./system"');
    const name =
      component === "tool-call"
        ? "ToolCallExample"
        : component === "tool-chips"
          ? "ToolChipsExample"
          : component === "loading-state"
            ? "LoadingStateExample"
            : component === "thinking-indicator"
              ? "ThinkingIndicatorExample"
              : component === "thinking-state"
                ? "ThinkingStateExample"
                : component === "file-tree"
                  ? "FileTreeExample"
                  : component === "task-rows"
                    ? "TaskRowsExample"
                    : component === "notification-list"
                      ? "NotificationListExample"
                      : component === "steps"
                        ? "StepsExample"
                        : "TimelineExample";
    return `${source}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example() { return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(model)}} /></SystemProvider></div>; }
`;
  }
  if (
    isOneOf(component, [
      "slider",
      "otp-input",
      "date-picker",
      "file-dropzone",
      "color-picker",
      "tag-input",
      "filter-bar",
      "chip",
      "input-copy",
    ])
  ) {
    const name =
      component === "slider"
        ? "SliderExample"
        : component === "otp-input"
          ? "OTPInputExample"
          : component === "date-picker"
            ? "DatePickerExample"
            : component === "file-dropzone"
              ? "FileDropzoneExample"
              : component === "color-picker"
                ? "ColorPickerExample"
                : component === "tag-input"
                  ? "TagInputExample"
                  : component === "filter-bar"
                    ? "FilterBarExample"
                    : component === "chip"
                      ? "ChipExample"
                      : "InputCopyExample";
    const entrySource =
      component === "slider"
        ? sliderSource
        : component === "otp-input"
          ? otpSource
          : component === "date-picker"
            ? dateSource
            : component === "file-dropzone"
              ? filesSource
              : component === "color-picker"
                ? colorsSource
                : component === "tag-input"
                  ? tagSource
                  : component === "filter-bar"
                    ? filterSource
                    : component === "chip"
                      ? chipSource
                      : copySource;
    const source = entrySource.replace(
      /from "\.\.\/\.\.\/index"/g,
      'from "./system"',
    );
    return `${source}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example() { return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><${name} language={${json(language)}} {...${json(model)}} /></SystemProvider></div>; }
`;
  }
  if (component === "sidebar") {
    const p = model as SidebarModel;
    const source = sidebarSource.replace(
      /from "\.\.\/\.\.\/index"/g,
      'from "./system"',
    );
    return `${source}
import { SystemProvider, defaultConfig } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
export default function Example() {
  const [collapsed, setCollapsed] = useState(${json(p.collapsed)});
  return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><SidebarExample language={${json(language)}} grouped={${p.grouped}} nested={${p.nested}} footer={${p.footer}} longLabels={${p.longLabels}} ${p.mode === "controlled" ? "collapsed={collapsed} onCollapsedChange={setCollapsed}" : "defaultCollapsed={collapsed} onCollapsedChange={setCollapsed}"} /></SystemProvider></div>;
}
`;
  }
  if (isOneOf(component, chartIds))
    return generateChartCode(component, model as ChartModel, config, language);
  if (
    isOneOf(component, [
      "card",
      "accordion",
      "breadcrumbs",
      "pagination",
      "alert",
      "skeleton",
      "progress",
      "spinner",
      "avatar",
      "avatar-group",
      "tooltip",
      "modal",
      "empty-state",
    ])
  )
    return generateBatchCode(component, model, config, language);
  if (component === "data-table") {
    const p = model as DataTableModel;
    const source = (text: string) => text.replace(/^import[\s\S]*?;\n/gm, "");
    return `import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button, Field, Input, Select, Sheet, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, useToast, DataTable, Badge, DropdownMenu, SystemProvider, ToastProvider, defaultConfig, numberLocale, useSystem } from "./system";
import type { DataTableColumn } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
${source(createSource)}
${source(customerSource)}
export default function Example() {
  return <div lang={${json(language)}}><SystemProvider config={{ ...defaultConfig, ...${json(config)} }}><ToastProvider label={${json(language === "ar" ? "تنبيهات العملاء" : "Customer notifications")}} closeLabel={${json(language === "ar" ? "إغلاق التنبيه" : "Dismiss notification")}}><CustomerDataTable language={${json(language)}} caption={${json(p.caption)}} preset={${json(p.preset)}} /></ToastProvider></SystemProvider></div>;
}
`;
  }
  const c = previewConfig(config, model),
    imports = new Set(["SystemProvider", "defaultConfig"]),
    otherImports = new Set<string>();
  const t = words(language);
  let declarations = "",
    jsx = "";
  const recordEvent = "setEvent";
  if (component === "badge") {
    const p = model as BadgeModel;
    imports.add("Badge");
    jsx = `<Badge tone="${p.tone}">{${json(p.children)}}</Badge>`;
  } else if (component === "checkbox") {
    const p = model as CheckboxModel;
    imports.add("Checkbox");
    declarations =
      p.mode === "controlled"
        ? `const [checked, setChecked] = useState(${p.checked});`
        : "";
    jsx = `<Checkbox ${attribute("label", p.label)} ${attribute("helper", p.helper)} ${attribute("error", p.error)} required={${p.required}} disabled={${p.disabled}} ${attribute("name", p.name)} ${attribute("value", p.value)} ${p.mode === "controlled" ? "checked={checked}" : `defaultChecked={${p.checked}}`} onChange={event => { ${p.mode === "controlled" ? "setChecked(event.currentTarget.checked);" : ""} setEvent("onChange: " + event.currentTarget.checked); }} />`;
  } else if (component === "radio-group" || component === "textarea") {
    const p = model as RadioGroupModel | TextareaModel;
    const name = component === "radio-group" ? "RadioGroup" : "Textarea";
    imports.add(name);
    declarations =
      p.mode === "controlled"
        ? `const [value, setValue] = useState(${json(p.value)});`
        : "";
    const change =
      component === "radio-group"
        ? `onValueChange={next => { ${p.mode === "controlled" ? "setValue(next);" : ""} setEvent("onValueChange: " + next); }}`
        : `onChange={event => { ${p.mode === "controlled" ? "setValue(event.currentTarget.value);" : ""} setEvent("onChange: " + event.currentTarget.value); }}`;
    const extras =
      component === "radio-group"
        ? `options={${json((p as RadioGroupModel).options)}}`
        : `rows={${(p as TextareaModel).rows}} readOnly={${(p as TextareaModel).readOnly}} ${attribute("placeholder", (p as TextareaModel).placeholder)}`;
    jsx = `<${name} ${attribute("label", p.label)} ${attribute("helper", p.helper)} ${attribute("error", p.error)} required={${p.required}} disabled={${p.disabled}} ${attribute("name", p.name)} ${p.mode === "controlled" ? "value={value}" : attribute("defaultValue", p.value)} ${extras} ${change} />`;
  } else if (component === "table") {
    const p = model as TableModel;
    for (const name of [
      "Table",
      "TableHeader",
      "TableBody",
      "TableRow",
      "TableHead",
      "TableCell",
    ])
      imports.add(name);
    declarations =
      p.preset === "empty"
        ? ""
        : `const rows = ${json([
            {
              id: "madar",
              name: t("شركة مدار للتقنية", "Madar Technology"),
              email: "hello@madar.sa",
              status: t("نشط", "Active"),
            },
            {
              id: "nour",
              name: t(
                "مؤسسة نور للخدمات والاستشارات",
                "Nour Services and Consulting",
              ),
              email: "team@nour.com.sa",
              status: t("متوقف", "Paused"),
            },
          ])};`;
    jsx = `<Table ${attribute("caption", p.caption)} ${p.caption ? "" : attribute("aria-label", t("العملاء", "Customers"))}>
        <TableHeader><TableRow>
          <TableHead>{${json(t("الاسم", "Name"))}}</TableHead>
          <TableHead>{${json(t("البريد الإلكتروني", "Email"))}}</TableHead>
          <TableHead>{${json(t("الحالة", "Status"))}}</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          ${
            p.preset === "empty"
              ? `<TableRow><TableCell colSpan={3}>{${json(t("لا يوجد عملاء بعد.", "No customers yet."))}}</TableCell></TableRow>`
              : `{rows.map(row => <TableRow key={row.id}>
            <TableHead scope="row"><bdi>{row.name}</bdi></TableHead>
            <TableCell><bdi dir="ltr">{row.email}</bdi></TableCell>
            <TableCell>{row.status}</TableCell>
          </TableRow>)}`
          }
        </TableBody>
      </Table>`;
  } else if (
    component === "field" ||
    component === "input" ||
    component === "select"
  ) {
    const p = model as FieldModel | InputModel | SelectModel;
    if (component !== "input") imports.add("Field");
    const controlName = component === "select" ? "Select" : "Input";
    imports.add(controlName);
    const f = `<Field ${attribute("label", p.label)} ${attribute("helper", p.helper)} ${attribute("error", p.error)} required={${p.required}}>`;
    if (component === "field")
      jsx = `${f}{field => <Input field={field} onChange={event => setEvent("onChange: " + event.currentTarget.value)} />}</Field>`;
    else {
      const control = p as InputModel | SelectModel;
      declarations =
        control.mode === "controlled"
          ? `const [value, setValue] = useState(${json(control.value)});`
          : "";
      const state =
        control.mode === "controlled"
          ? "value={value}"
          : attribute("defaultValue", control.value);
      const change =
        component === "input"
          ? `onChange={event => { ${control.mode === "controlled" ? "setValue(event.currentTarget.value);" : ""} setEvent("onChange: " + event.currentTarget.value); }}`
          : `onValueChange={next => { ${control.mode === "controlled" ? "setValue(next);" : ""} setEvent("onValueChange: " + next); }}`;
      const extras =
        component === "input"
          ? `type="${(p as InputModel).type}" readOnly={${(p as InputModel).readOnly}}`
          : `options={${json((p as SelectModel).options)}}`;
      const common = `${state} ${attribute("placeholder", control.placeholder)} ${attribute("name", control.name)} size="${control.size}" disabled={${control.disabled}} ${extras} ${change}`;
      jsx =
        component === "input"
          ? `<Input ${attribute("label", p.label)} ${attribute("helper", p.helper)} ${attribute("error", p.error)} required={${p.required}} ${common} />`
          : `${f}{field => <Select field={field} invalid={${(p as SelectModel).invalid}} ${common} />}</Field>`;
    }
  } else if (component === "button") {
    const p = model as ButtonModel;
    imports.add("Button");
    const icons = {
      none: "",
      plus: "Plus",
      download: "Download",
      settings: "Settings2",
    };
    const icon = icons[p.icon];
    if (icon) otherImports.add(`import { ${icon} } from "lucide-react";`);
    declarations =
      p.action === "simulate"
        ? `const [state, setState] = useState<ButtonState>(${json(p.state)});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);
  function handleClick() {
    if (busy.current || ${p.disabled} || state === "loading") return;
    if (timer.current !== null) clearTimeout(timer.current);
    busy.current = true;
    setEvent("onClick → loading");
    setState("loading");
    timer.current = setTimeout(() => {
      busy.current = false;
      setState(${json(p.outcome)});
      setEvent(${json(`onClick → ${p.outcome}`)});
      timer.current = setTimeout(() => {
        timer.current = null;
        setState(${json(p.state)});
        setEvent(${json(`state → ${p.state}`)});
      }, 1000);
    }, 1200);
  }`
        : `function handleClick() { setEvent("onClick"); }`;
    const iconChild = icon ? `<${icon} size={16} />` : "";
    jsx = `<Button\n        variant="${p.variant}"\n        size="${p.size}"\n        ${p.action === "simulate" ? "state={state}" : `state="${p.state}"`}\n        disabled={${p.disabled}}\n        type="${p.type}"\n        ${p.iconOnly ? `iconOnly\n        ${attribute("aria-label", p.ariaLabel || (typeof p.attributes["aria-label"] === "string" ? p.attributes["aria-label"] : "") || p.children || t("زر الإجراء", "Action button"))}` : p.ariaLabel ? attribute("aria-label", p.ariaLabel) : ""}\n        ${nativeCode(p)}\n        onClick={handleClick}\n      >\n        ${iconChild}${p.iconOnly && !icon ? '<span aria-hidden="true">+</span>' : !p.iconOnly ? `<bdi dir="auto">{${json(p.children)}}</bdi>` : ""}\n      </Button>`;
  } else if (component === "tabs") {
    const p = model as TabsModel;
    imports.add("Tabs");
    declarations =
      p.mode === "controlled"
        ? `const [value, setValue] = useState(${json(p.value)});`
        : "";
    jsx = `<Tabs\n        ${attribute("label", p.label)}\n        variant="${p.variant}"\n        ${p.mode === "controlled" ? "value={value}" : attribute("defaultValue", p.value)}\n        ${p.className ? attribute("className", p.className) : ""}\n        items={${JSON.stringify(p.items, null, 2)}}\n        onValueChange={(next) => { ${p.mode === "controlled" ? "setValue(next); " : ""}${recordEvent}("onValueChange: " + next); }}\n      />`;
  } else if (component === "switch") {
    const p = model as SwitchModel;
    imports.add("Switch");
    declarations =
      p.mode === "controlled"
        ? `const [checked, setChecked] = useState(${p.checked});`
        : "";
    jsx = `<Switch\n        ${attribute("label", p.label)}\n        ${attribute("description", p.description)}\n        ${p.mode === "controlled" ? "checked={checked}" : `defaultChecked={${p.checked}}`}\n        disabled={${p.disabled}}\n        required={${p.required}}\n        type="${p.type}"\n        ${attribute("name", p.name)}\n        ${attribute("value", p.value)}\n        ${nativeCode(p)}\n        onCheckedChange={(next) => { ${p.mode === "controlled" ? "setChecked(next); " : ""}${recordEvent}("onCheckedChange: " + next); }}\n      />`;
  } else if (component === "dropdown") {
    const p = model as MenuModel;
    imports.add("Button");
    imports.add("DropdownMenu");
    declarations = `${p.mode === "controlled" ? `const [open, setOpen] = useState(${p.open});\n  ` : ""}const items = [\n${p.items
      .map((item) => {
        const icon = {
          none: "",
          plus: "Plus",
          download: "Download",
          settings: "Settings2",
        }[item.icon ?? "none"];
        if (icon) otherImports.add(`import { ${icon} } from "lucide-react";`);
        const data = { ...item };
        delete data.icon;
        return `    { ...${json(data)}, ${icon ? `icon: <${icon} size={16} />, ` : ""}onSelect: () => ${recordEvent}(${json("onSelect: " + item.id)}) }`;
      })
      .join(",\n")}\n  ];`;
    jsx = `<DropdownMenu\n        trigger={<Button variant="${p.triggerVariant}" size="${p.triggerSize}">{${json(p.triggerLabel)}}</Button>}\n        align="${p.align}"\n        ${p.mode === "controlled" ? "open={open}" : ""}\n        onOpenChange={(next) => { ${p.mode === "controlled" ? "setOpen(next); " : ""}${recordEvent}("onOpenChange: " + next); }}\n        items={items}\n      />`;
  } else if (component === "sheet") {
    const p = model as SheetModel;
    imports.add("Button");
    imports.add("Sheet");
    if (p.footer)
      otherImports.add(
        'import { Close as SheetClose } from "@radix-ui/react-dialog";',
      );
    declarations =
      p.mode === "controlled"
        ? `const [open, setOpen] = useState(${p.open});`
        : "";
    jsx = `<Sheet\n        trigger={<Button variant="${p.triggerVariant}" size="${p.triggerSize}">{${json(p.triggerLabel)}}</Button>}\n        ${attribute("title", p.title)}\n        ${attribute("description", p.description)}\n        ${attribute("closeLabel", p.closeLabel)}\n        ${p.side === "auto" ? "" : `side="${p.side}"`}\n        ${p.mode === "controlled" ? "open={open}" : ""}\n        onOpenChange={(next) => { ${p.mode === "controlled" ? "setOpen(next); " : ""}${recordEvent}("onOpenChange: " + next); }}\n        ${p.footer ? `footer={<SheetClose asChild><Button>{${json(p.footerLabel)}}</Button></SheetClose>}` : ""}\n      >\n        <p dir="auto">{${json(p.children)}}</p>\n        <dl>\n          <div><dt>{${json(t("البريد الإلكتروني", "Email"))}}</dt><dd><bdi dir="ltr">hello@madar.sa</bdi></dd></div>\n          <div><dt>{${json(t("الموقع الإلكتروني", "Website"))}}</dt><dd><bdi dir="ltr">https://madar.sa</bdi></dd></div>\n        </dl>\n      </Sheet>`;
  } else if (component === "toast") {
    const p = model as ToastModel;
    imports.add("Button");
    imports.add("ToastProvider");
    imports.add("useToast");
    declarations = "const { toast } = useToast();";
    jsx = `<Button variant="secondary" onClick={() => {\n        toast(${JSON.stringify({ title: p.title, description: p.description, tone: p.tone, duration: p.duration }, null, 2)});\n        setEvent("toast: ${p.tone}");\n      }}>{${json(p.triggerLabel)}}</Button>`;
  } else {
    return assertNever(component, "generateCode");
  }
  const importsCode = `${["table", "badge"].includes(component) ? "" : `import { useState${component === "button" && (model as ButtonModel).action === "simulate" ? ", useEffect, useRef" : ""} } from "react";\n`}import { ${[...imports].join(", ")} } from "./system";\nimport type { SystemConfig${component === "button" && (model as ButtonModel).action === "simulate" ? ", ButtonState" : ""} } from "./system";\n${[...otherImports].join("\n")}\nimport "@fontsource/ibm-plex-sans-arabic/400.css";\nimport "@fontsource/ibm-plex-sans-arabic/500.css";\nimport "@fontsource/ibm-plex-sans-arabic/600.css";\nimport "./system/tokens.css";\nimport "./system/components.css";`;
  const configCode = `const config: SystemConfig = {\n  ...defaultConfig,\n  theme: "${c.theme}",\n  direction: "${c.direction}",\n  density: "${c.density}",\n  accent: "${c.accent}",\n  typography: "${c.typography ?? "standard"}",\n  numerals: "${c.numerals ?? "arab"}",\n  radius: ${c.radius},\n  reducedMotion: ${c.reducedMotion},\n};`;
  const inner = `function Demo() {\n  ${["table", "badge"].includes(component) ? "" : 'const [event, setEvent] = useState("");'}\n  ${declarations}\n  return (\n    <>\n      ${jsx}\n      ${["table", "badge"].includes(component) ? "" : '<output aria-live="polite" dir="auto">{event}</output>'}\n    </>\n  );\n}`;
  const p = model as ToastModel;
  return `${importsCode}\n\n${configCode}\n\n${inner}\n\nexport default function Example() {\n  return (\n    <div lang={${json(language)}}><SystemProvider config={config}>\n      ${component === "toast" ? `<ToastProvider ${attribute("label", p.providerLabel)} ${attribute("closeLabel", p.closeLabel)}>\n        <Demo />\n      </ToastProvider>` : "<Demo />"}\n    </SystemProvider></div>\n  );\n}\n`;
}
export function generateCode(
  component: ComponentId,
  model: PlaygroundModel,
  config: SystemConfig,
  language: Language,
  colors: BrandColors = {},
): string {
  return withCustomTheme(
    generateBaseCode(component, model, config, language),
    config,
    colors,
  );
}
export function generatePrompt(
  component: ComponentId,
  model: PlaygroundModel,
  config: SystemConfig,
  language: Language,
  colors: BrandColors = {},
): string {
  const entry = catalog.find((item) => item.id === component)!;
  const c = previewConfig(config, model);
  const code = generateCode(component, model, config, language, colors);
  const notes: string[] = [];
  if (/\.\/system\/ai\/assets\/(sara|omar)\.jpg/.test(code))
    notes.push(
      "Keep the bundled portraits referenced by this example, ai/assets/README.md and ai/assets/LICENSE.txt. Adjust local asset imports to the copied source root; do not replace these portraits with a remote image service.",
    );
  if (component === "terminal")
    notes.push(
      "Terminal is read-only: the host supplies text, execution state, exit code and duration. Copy is command + newline + output, or output alone. No HTML/ANSI interpretation, execution, shell or connection.",
      "Output scrolls internally by keyboard. Opt-in following must preserve selection and older reading.",
    );
  if (component === "chat-app")
    notes.push(
      "ChatApp composes Sidebar and Sheet with children, composer, toolbar, actions and sidePanel slots. Use ChatThread with patterns as messages in plain appearance, and TaskStarter in plain appearance as the composer.",
      "Host owns conversations with unique stable IDs, groups, messages, drafts and cancellation, plus the rename field and the confirmation before a delete. The component reports onConversationRename and onConversationDelete intents. Bind callbacks to conversation and run identity so stale work never updates another conversation.",
      "The example tells the October close in memory and cancels its timers on unmount. It has no backend, auth, persistence, real AI or tool execution.",
    );
  if (["image-result", "sources", "insight-cards"].includes(component))
    notes.push(
      "Copy the entire ai/assets/results directory, including local SVG images and sample text documents. Preserve ?url&no-inline imports. Source copies need @radix-ui/react-popover@1.3.1 and the Radix overrides in ai/README.md.",
      "Host owns images, alt text, stable source IDs/numbers, findings and actions. ImageResult progress must be a real supplied 0-100 percentage; omit it when unknown. URLs allow HTTP(S) or relative/local destinations only; missing/rejected destinations remain honest text. Use links for navigation and buttons for disclosure. These components do not generate or retrieve content.",
    );
  if (["chat-thread", "chat-composer", "prompt-bar"].includes(component))
    notes.push(
      "Host owns stable message IDs, draft, submission, cancellation and execution state. Entry direction follows SystemProvider: right-start in RTL, left-start in LTR, regardless of draft script. Use native dir only for an intentional override.",
      "Enter sends; Shift+Enter inserts a newline. Never submit during IME composition. Preserve valid text exactly and clear only on host acceptance. Following output is opt-in and near-bottom only; preserve older reading, settled selection and focus.",
      "ai/examples/ChatExamples.tsx supplies fixed local response chunks. Invalidate callbacks on stop/reset/unmount. Connect real responses through the host; the example adds no network, storage or uploads.",
    );
  if (["code-block", "markdown", "streaming-text"].includes(component))
    notes.push(
      "For a source copy, resolve react-markdown@10.1.0 and remark-gfm@4.0.1 through the host toolchain. CommonMark plus GFM only; raw HTML is disabled and unsafe URLs rejected. Unsupported code languages remain plain text; code stays LTR.",
      "Host owns text, streaming/completed state and cancellation. Do not add a typing queue or network. The StreamingText example plays its local sample once on mount. Invalidate timers on replay/unmount and retain received text on cancellation.",
    );
  if (
    [
      "tool-call",
      "tool-chips",
      "loading-state",
      "thinking-indicator",
      "thinking-state",
    ].includes(component)
  )
    notes.push(
      "The host owns execution and brief user-facing summaries. Never expose private model reasoning or fabricate logs. Use one polite announcement owner. Start local simulations explicitly and cancel timers on replay/unmount.",
    );
  if (["tool-call", "tool-chips"].includes(component))
    notes.push(
      "ToolCall details one supplied operation; ToolChips summarizes activity without automatic details. Connect onRetry/onActivate to host behavior. These components add no tool execution, network, permissions or execution timers.",
    );
  if (component === "file-tree")
    notes.push(
      "FileTree displays supplied data only. onActivate delegates opening to the host; the example reads application-owned sample strings without filesystem access.",
    );
  if (
    ["ask-user-questions", "approval-card", "approval-flow"].includes(component)
  )
    notes.push(
      "Supported questions are single choice with optional Other, or text only. Honor AbortSignal on reset, replacement and unmount, and preserve drafts on failure.",
      "The host must validate request identity, authorization and execution independently. Approval is a one-time decision and grants no execution or ongoing permission. Changed content invalidates old decisions. Controlled ApprovalRecord values must bind requestId and approvalRequestKey to the exact current request. Do not add standing access or approve-all.",
    );
  if (
    ["selection-actions", "context-meter", "model-selector"].includes(component)
  )
    notes.push(
      "SelectionActions is scoped to children and excludes editors, code, links and buttons. Alt+Enter focuses actions; Escape returns to the scope. Preserve native selection/copy; scroll dismisses.",
      "Models use controlled stable IDs and onValueChange. Usage, capacity, estimates, prices and availability belong to the host. These components add no AI execution, automatic replacement or network.",
      "Use the installed dependencies for this component, including any required Popper, Popover, Select and Radix layer overrides documented in ai/README.md. Preserve the installed source subset; do not replace it with the complete bundle.",
    );

  if (
    isAgentPreview(component) &&
    (model as unknown as Record<string, unknown>).agentAppearance === "mascot"
  )
    notes.push(
      "This example uses the optional Khayt avatar through agentPresentation. Copy mascot/Khayt.tsx, khayt-artwork.ts, khayt-renderer.ts, khayt-motion.ts, khayt.css and the full mascot/assets directory from the checkout's src/mascot beside the copied system directory. Preserve asset paths and provenance; adjust Khayt's useReducedMotion import if your source-root folder has another name. The studio and workbench are not needed. The host maps its actual state to the avatar; respect reduced motion and keep the existing visible status and single announcement owner. Switching to the original AI icon omits this optional runtime.",
    );

  return [
    `First locate Tiraz, then integrate the ${localize(entry.name, "en")} example into my application using the current settings below.`,
    `## Locate the source

1. Find the full checkout or source copy in the current project. If tiraz.project.json exists, follow its directory and installed components; selective installs intentionally contain a subset. The source root contains index.ts, config.ts, tokens.css, components.css and ai/. In a checkout it is usually src/system; for example, src/system/${entry.file}. If you cannot locate the system, report the missing source, request its location and stop.
2. Read ai/README.md and, when present, ai/composition.md. A selective install has subset guidance; do not require files it does not include. In ai/registry.json, query only the relevant entries: the "${entry.id}" family in components, its support APIs, and the records used by its props. Registry paths are relative to the source root, not the application root.
3. Inspect ${entry.file}, the exported types in index.ts, config.ts, Provider.tsx and the relevant styles. Source and exported types are authoritative; workbench controls show a subset of the API. A source copy needs no checkout README or src/main.tsx. Do not invent exports/props or add an installer or CLI.`,
    `## Current settings

Language: ${language === "ar" ? "Arabic" : "English"} (${language})
SystemProvider: ${JSON.stringify(c)}

Keep the example's exact props, supplied content, state choices and shared settings unless the requested application behavior requires a change. The TSX below captures the current selection.`,
    `## Integrate

- Place the example in an appropriate application component file. Adjust ./system imports, CSS paths and local asset imports to the located source root.
- Reuse the host's toolchain and existing Tiraz setup. Respect the installed subset; do not expand it to the full library. Preserve existing customized component source and the app-owned tiraz.theme.css. Retain the installed guidance, provenance and licenses. If an export is missing, report the needed component and follow the installer supported by that local release.
- Load tokens.css and components.css once. Verify the host loads local IBM Plex Sans Arabic at weights 400, 500 and 600. Follow ai/README.md for dependencies and Radix overrides.
- Keep SystemProvider around the interface and its overlays, merge settings with defaultConfig, and set lang on a host ancestor above the provider. Preserve :dir() in the host CSS pipeline.
- Connect events to the requested application behavior and keep application state in the host. Replace demonstration handlers where needed; identify any remaining sample data or local simulation.`,
    ...(notes.length
      ? [`## Component notes\n\n${notes.map((note) => `- ${note}`).join("\n")}`]
      : []),
    `## Validate

- Run the host's relevant type checks, tests and build. Resolve imports and assets against the actual source location.
- Inspect the rendered result with the selected settings, then check RTL and LTR, narrow layouts, theme, typography, numerals and reduced motion.
- Exercise the connected interactions with keyboard and pointer. Check focus order, focus restoration for overlays, accessible names and relevant loading, empty, error and disabled states.
- Report changed files, checks run and remaining integration work. Do not claim production readiness or accessibility from compilation alone.`,
    ...(Object.keys(normalizeBrandColors(colors)).length
      ? [
          `## Custom theme

The example includes these exact rules so it runs independently. For an app-wide theme, merge them into the user-owned tiraz.theme.css, import after default styles, and remove the example's inline style block. Preserve unrelated theme rules.

\`\`\`css
${generateThemeCss(c, colors)}\`\`\``,
        ]
      : []),
    `## Current example

\`\`\`tsx
${code}${code.endsWith("\n") ? "" : "\n"}\`\`\``,
  ].join("\n\n");
}
