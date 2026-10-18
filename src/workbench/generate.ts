import localResponseSource from "../system/ai/examples/useLocalResponse.ts?raw";
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
import { catalog } from "./catalog";
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
export function generateCode(
  component: ComponentId,
  model: PlaygroundModel,
  config: SystemConfig,
  language: Language,
): string {
  if (component === "terminal" || component === "chat-app") {
    const source = (component === "terminal" ? terminalSource : chatAppSource)
      .replace(/from "\.\.\/\.\.\/index"/g, 'from "./system"')
      .replace(
        'import { useLocalResponse } from "./useLocalResponse";',
        localResponseSource,
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
    ["ask-user-questions", "approval-card", "approval-flow"].includes(component)
  ) {
    const source = aiDecisionsSource.replace(
      /from "\.\.\/\.\.\/index"/g,
      'from "./system"',
    );
    const name =
      component === "ask-user-questions"
        ? "AskUserQuestionsExample"
        : component === "approval-card"
          ? "ApprovalCardExample"
          : "ApprovalFlowExample";
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
    ["selection-actions", "context-meter", "model-selector"].includes(component)
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
  if (["image-result", "sources", "insight-cards"].includes(component)) {
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
  if (["chat-thread", "chat-composer", "prompt-bar"].includes(component)) {
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
  if (["code-block", "markdown", "streaming-text"].includes(component)) {
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
export default function Example(){return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><div style={{display:"grid",gap:"var(--space-5)",minInlineSize:0}}><${name} language={${json(language)}} {...${json(model)}}/>${component === "streaming-text" ? `<StreamingDemo language={${json(language)}} markdown autoStart/>` : ""}</div></SystemProvider></div>;}`;
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
export default function Example() { return <div lang={${json(language)}}><SystemProvider config={{...defaultConfig,...${json(config)}}}><div style={{display:"grid",gap:"var(--space-8)",minInlineSize:0}}><${name} language={${json(language)}} {...${json(model)}} />${component === "steps" ? `<StepsFormExample language={${json(language)}} />` : ""}</div></SystemProvider></div>; }
`;
  }
  if (
    [
      "slider",
      "otp-input",
      "date-picker",
      "file-dropzone",
      "color-picker",
      "tag-input",
      "filter-bar",
      "input-copy",
    ].includes(component)
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
  if (component.endsWith("-chart"))
    return generateChartCode(component, model as ChartModel, config, language);
  if (
    [
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
    ].includes(component)
  )
    return generateBatchCode(component, model, config, language);
  if (component === "data-table") {
    const p = model as DataTableModel;
    const source = (text: string) => text.replace(/^import[\s\S]*?;\n/gm, "");
    return `import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button, Field, Input, Select, Sheet, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, useToast, DataTable, Badge, DropdownMenu, SystemProvider, ToastProvider, defaultConfig } from "./system";
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
  } else {
    const p = model as ToastModel;
    imports.add("Button");
    imports.add("ToastProvider");
    imports.add("useToast");
    declarations = "const { toast } = useToast();";
    jsx = `<Button variant="secondary" onClick={() => {\n        toast(${JSON.stringify({ title: p.title, description: p.description, tone: p.tone, duration: p.duration }, null, 2)});\n        setEvent("toast: ${p.tone}");\n      }}>{${json(p.triggerLabel)}}</Button>`;
  }
  const importsCode = `${["table", "badge"].includes(component) ? "" : `import { useState${component === "button" && (model as ButtonModel).action === "simulate" ? ", useEffect, useRef" : ""} } from "react";\n`}import { ${[...imports].join(", ")} } from "./system";\nimport type { SystemConfig${component === "button" && (model as ButtonModel).action === "simulate" ? ", ButtonState" : ""} } from "./system";\n${[...otherImports].join("\n")}\nimport "@fontsource/ibm-plex-sans-arabic/400.css";\nimport "@fontsource/ibm-plex-sans-arabic/500.css";\nimport "@fontsource/ibm-plex-sans-arabic/600.css";\nimport "./system/tokens.css";\nimport "./system/components.css";`;
  const configCode = `const config: SystemConfig = {\n  ...defaultConfig,\n  theme: "${c.theme}",\n  direction: "${c.direction}",\n  density: "${c.density}",\n  accent: "${c.accent}",\n  typography: "${c.typography ?? "standard"}",\n  radius: ${c.radius},\n  reducedMotion: ${c.reducedMotion},\n};`;
  const inner = `function Demo() {\n  ${["table", "badge"].includes(component) ? "" : 'const [event, setEvent] = useState("");'}\n  ${declarations}\n  return (\n    <>\n      ${jsx}\n      ${["table", "badge"].includes(component) ? "" : '<output aria-live="polite" dir="auto">{event}</output>'}\n    </>\n  );\n}`;
  const p = model as ToastModel;
  return `${importsCode}\n\n${configCode}\n\n${inner}\n\nexport default function Example() {\n  return (\n    <div lang={${json(language)}}><SystemProvider config={config}>\n      ${component === "toast" ? `<ToastProvider ${attribute("label", p.providerLabel)} ${attribute("closeLabel", p.closeLabel)}>\n        <Demo />\n      </ToastProvider>` : "<Demo />"}\n    </SystemProvider></div>\n  );\n}\n`;
}
export function generatePrompt(
  component: ComponentId,
  model: PlaygroundModel,
  config: SystemConfig,
  language: Language,
): string {
  const entry = catalog.find((item) => item.id === component)!;
  const t = words(language);
  const c = previewConfig(config, model);
  return (
    t(
      `اعثر أولًا على طِراز داخل المشروع الحالي، سواء كان مشروعًا كاملًا أو نسخة المصدر في تطبيق آخر. إذا لم تتمكن من العثور على النظام، أبلغ بذلك بوضوح وتوقف. حدّد جذر المصدر: المجلد الذي يحوي index.ts وconfig.ts وtokens.css وcomponents.css وai/. في المشروع الكامل يكون عادة src/system؛ مثل src/system/${entry.file}. اقرأ ai/README.md وai/registry.json لقسم ${entry.id} وواجهات الدعم وai/composition.md، ثم افحص ${entry.file} وindex.ts وconfig.ts وProvider.tsx والأنماط وإعداد الخط المحلي في التطبيق. لصور Avatar احتفظ بـ ai/assets/sara.jpg وai/assets/omar.jpg وai/assets/README.md وai/assets/LICENSE.txt عند نسخ المصدر، وعدّل الاستيرادات المحلية. مسارات السجل نسبية إلى جذر المصدر، ولا تتطلب نسخة المصدر README للمشروع أو src/main.tsx. استخدم ${localize(entry.name, language)} بالخصائص والإعدادات الحالية كما في المثال. عدّل استيرادات ./system ومسارات CSS إلى موقع المكتبة، واربط الأحداث بسلوك التطبيق المطلوب، وتحقق من العرض الفعلي والاتجاه والتخصيص ولوحة المفاتيح والتركيز والأسماء الميسرة. لا تخترع تصديرات أو خصائص ولا تضف مثبتًا أو CLI.`,
      `First locate Tiraz within the current project, either a full checkout or a source copy in another application. If you cannot locate the system, clearly report that and stop. Identify the source root: the directory containing index.ts, config.ts, tokens.css, components.css and ai/. In a full checkout this is usually src/system; for example src/system/${entry.file}. Read ai/README.md, ai/registry.json for the ${entry.id} family and support APIs, and ai/composition.md; then inspect ${entry.file}, index.ts, config.ts, Provider.tsx, styles and the host application's local font setup. For Avatar photos, preserve ai/assets/sara.jpg, ai/assets/omar.jpg, ai/assets/README.md and ai/assets/LICENSE.txt with the copied source; adjust emitted local imports, do not replace bundled portraits with remote services. Registry paths are relative to the source root; a source copy needs no checkout README or src/main.tsx. Use ${localize(entry.name, language)} with the exact current properties and system settings in the example. Adjust ./system imports and CSS paths to the located library, connect events to the requested application behavior, and validate the rendered result, direction, customization, keyboard, focus and accessible names. Do not invent exports/props or add an installer or CLI.`,
    ) +
    (["terminal", "chat-app"].includes(component)
      ? t(
          "\nTerminal للقراءة فقط: النص وحالة التنفيذ ورمز الخروج والمدة يزوّدها التطبيق. النسخ هو command ثم سطر جديد ثم output، أو output وحده. لا HTML أو تفسير ANSI أو تنفيذ أو اتصال. التمرير داخلي وقابل للوحة المفاتيح؛ المتابعة قرب النهاية فقط وتحترم التحديد. ChatApp يؤلف Sidebar وSheet مع children وcomposer وtoolbar. التطبيق يملك المحادثات بمعرّفات فريدة ثابتة والرسائل والمسودات والنموذج والإلغاء. استخدم ChatThread وChatComposer وPromptBar وModelSelector. العينة في الذاكرة تلغي الرد عند التبديل أو الإنشاء مع الاحتفاظ بالنص والمسودات؛ إعادة الضبط تستعيد العينات، والإزالة تلغي المؤقتات. لا تسمح باستدعاءات قديمة بتحديث محادثة أخرى.",
          "\nTerminal is read-only: the host supplies text, execution state, exit code and duration. Copy is command + newline + output, or output alone. No HTML/ANSI interpretation, execution, shell or connection. Output scrolls internally by keyboard; opt-in following respects selection and older reading. ChatApp composes Sidebar and Sheet with children, composer and toolbar slots. Host owns conversations with unique stable IDs, messages, drafts, model and cancellation. Reuse ChatThread, ChatComposer, PromptBar and ModelSelector. The in-memory example cancels on switch/new and keeps received text and per-conversation drafts/models; reset restores samples; unmount cancels timers. Bind callbacks to conversation and run identity; stale work must never update another conversation. No backend, auth, persistence, real AI or tool execution.",
        )
      : "") +
    (["image-result", "sources", "insight-cards"].includes(component)
      ? t(
          "\nاحتفظ بمجلد ai/assets/results كاملًا: صور SVG ومستندات العينة مع استيرادات ?url&no-inline. ثبّت @radix-ui/react-popover@1.3.1 مع قرارات Radix الموثقة في ai/README.md. التطبيق يملك الصور والنص البديل والمصادر وأرقامها الثابتة والنتائج والإجراءات. تقدّم ImageResult نسبة فعلية يوفّرها التطبيق من 0 إلى 100؛ احذفها إذا كانت مجهولة ولا تختلق نسبة بمؤقّت. الروابط HTTP(S) أو نسبية/محلية فقط؛ الوجهات المفقودة أو المرفوضة نص صريح. استخدم رابطًا للتنقل وزرًا للتفاصيل؛ لا تخترع توليدًا أو استرجاعًا.",
          "\nCopy the entire ai/assets/results directory: local SVG images and sample text documents with ?url&no-inline imports. Source copies need @radix-ui/react-popover@1.3.1 and the Radix overrides in ai/README.md. Host owns images, alt text, stable source IDs/numbers, findings and actions. ImageResult progress is a real supplied 0–100 percentage; omit for unknown progress and never invent a timer-based percentage. URLs allow HTTP(S) or relative/local destinations only; missing/rejected destinations remain honest text. Use links for navigation and buttons for disclosure; no generation or retrieval.",
        )
      : "") +
    (["chat-thread", "chat-composer", "prompt-bar"].includes(component)
      ? t(
          "\nالتطبيق يملك الرسائل بمعرّفات ثابتة والمسودة والإرسال والإيقاف. اتجاه الإدخال يتبع SystemProvider افتراضيًا: يبدأ من اليمين في RTL ومن اليسار في LTR مهما كانت لغة المسودة؛ استخدم dir للتجاوز المقصود فقط. Enter يرسل وShift+Enter يضيف سطرًا؛ لا ترسل أثناء IME. لا تقص النص الصحيح ولا تمسح المسودة إلا عند قبول التطبيق. المتابعة اختيارية قرب النهاية فقط؛ حافظ على القراءة والتحديد والتركيز. استخدم ai/examples/ChatExamples.tsx لعينة محلية ثابتة تبدأ بالإرسال الصريح وتلغي المؤقتات عند الإيقاف وإعادة الضبط والإزالة. بلا شبكة أو تخزين أو رفع.",
          "\nHost owns stable message IDs, draft, submission, cancellation and execution state. Entry direction follows SystemProvider by default: right-start in RTL, left-start in LTR, regardless of draft script; use native dir only for an intentional override. Enter sends; Shift+Enter inserts a newline; never submit during IME composition. Preserve valid text exactly and clear only on host acceptance. Follow output is opt-in and near-bottom only; preserve older reading, settled selection and focus. Reuse ai/examples/ChatExamples.tsx for fixed local chunks starting only on explicit submission; invalidate callbacks on stop/reset/unmount. No network, storage or uploads.",
        )
      : "") +
    (["code-block", "markdown", "streaming-text"].includes(component)
      ? t(
          "\nلنسخة المصدر ثبّت react-markdown@10.1.0 وremark-gfm@4.0.1. CommonMark وGFM فقط؛ HTML معطّل والروابط غير الآمنة مرفوضة. اللغات غير المدعومة نص عادي والشيفرة LTR. التطبيق يملك النص وحالة streaming/completed والإلغاء؛ لا تضف طابور كتابة أو شبكة. معاينة StreamingText والمثال يشغّلان عينة محلية واحدة تلقائيًا. ألغِ المؤقتات عند الإعادة والإزالة واحفظ النص عند الإلغاء.",
          "\nFor a source copy install react-markdown@10.1.0 and remark-gfm@4.0.1. CommonMark plus GFM only; raw HTML is disabled and unsafe URLs rejected. Unsupported code languages remain plain text; code stays LTR. Host owns text, streaming/completed state and cancellation. Do not add a typing queue or network. The StreamingText playground and documentation example each run one local sample automatically. Invalidate timers on replay/unmount and retain received text on cancellation.",
        )
      : "") +
    ([
      "tool-call",
      "tool-chips",
      "loading-state",
      "thinking-indicator",
      "thinking-state",
    ].includes(component)
      ? t(
          "\nحالة التنفيذ والملخصات الموجزة يزوّدها التطبيق. لا تعرض الاستدلال الخاص أو سجلات مختلقة. اجعل مالكًا واحدًا للإعلانات المهذبة؛ العرض المحلي يبدأ صراحة ويلغي المؤقتات عند الإعادة والإزالة.",
          "\nThe host owns execution and brief user-facing summaries. Never expose private model reasoning or fabricate logs. Use one polite announcement owner; a local simulation must start explicitly and cancel timers on replay/unmount.",
        )
      : "") +
    (["tool-call", "tool-chips"].includes(component)
      ? t(
          "\nToolCall يعرض عملية واحدة؛ ToolChips ملخص دون تفاصيل تلقائية. اربط onRetry وonActivate بسلوك التطبيق. لا تضف تنفيذ أدوات أو شبكة أو صلاحيات أو مؤقتات تنفيذ للمكتبة.",
          "\nToolCall details one supplied operation; ToolChips summarizes activity without automatic details. Connect onRetry/onActivate to real host behavior. Do not add tool execution, network, permissions or library execution timers.",
        )
      : "") +
    (component === "file-tree"
      ? t(
          "\nFileTree يعرض بيانات يزوّدها التطبيق فقط. onActivate يفوّض فتح الملف للتطبيق، والمعاينة تقرأ نصوص المثال المحلية دون نظام ملفات.",
          "\nFileTree displays supplied data only. onActivate delegates opening to the host; the preview reads application-owned sample strings without filesystem access.",
        )
      : "") +
    (["ask-user-questions", "approval-card", "approval-flow"].includes(
      component,
    )
      ? t(
          "\nأسئلة اختيار واحد مع إجابة أخرى أو نص فقط. التطبيق يتحقق من هوية الطلب والتفويض والتنفيذ بشكل مستقل. الموافقة قرار لمرة واحدة وليست تنفيذًا أو إذنًا مستمرًا. تغيير المحتوى يلغي القرار القديم؛ احترم AbortSignal عند الإعادة أو الاستبدال أو الإزالة. احتفظ بالمسودات عند الفشل.",
          "\nSupported questions: single choice with optional Other, or text only. The host must validate request identity, authorization and execution independently. Approval is a one-time decision, not execution or ongoing permission. Changed content invalidates old decisions; honor AbortSignal on reset, replacement and unmount. Preserve drafts on failure. Controlled ApprovalRecord values must bind requestId and approvalRequestKey to the exact current request. No standing access or approve all.",
        )
      : "") +
    (["selection-actions", "context-meter", "model-selector"].includes(
      component,
    )
      ? t(
          "\nSelectionActions محدود بنطاق children؛ يستثني المحررات والشيفرة والروابط والأزرار. Alt+Enter ينقل التركيز للإجراءات؛ Escape يعيده للنطاق. السحب والنسخ الأصليان محفوظان، والتمرير يغلق الشريط. النموذج متحكّم به عبر id ثابت وonValueChange. الاستخدام والسعة والتقديرات والأسعار يزوّدها التطبيق. لا تنفيذ ذكاء اصطناعي أو استبدال تلقائي أو شبكة. انسخ حزمة المصدر كاملة مع Popper وPopover وSelect وإصلاحات طبقات Radix المذكورة في ai/README.md.",
          "\nSelectionActions is scoped to children; excludes editors, code, links and buttons. Alt+Enter focuses actions; Escape returns to the scope. Preserve native selection/copy; scroll dismisses. Models use controlled stable IDs and onValueChange. Usage, capacity, estimates, prices and availability belong to the host. No AI execution, automatic replacement or network. Copy the complete source bundle with Popper, Popover, Select and the Radix layer overrides in ai/README.md.",
        )
      : "") +
    `\n\nSystemProvider: ${JSON.stringify(c)}\n\n${t("ضع المثال في ملف مناسب داخل تطبيقك بعد تعديل مسارات الاستيراد. احتفظ بحزمة ai/ عند نسخ المكتبة.", "Place the example in an appropriate application component file after adjusting imports. Retain the ai/ bundle when copying the library.")}\n\n\`\`\`tsx\n${generateCode(component, model, config, language)}\`\`\``
  );
}
