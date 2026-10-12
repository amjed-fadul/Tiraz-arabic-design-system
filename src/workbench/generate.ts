import type { SystemConfig } from "../system";
import type { ComponentId } from "./catalog";
import { catalog } from "./catalog";
import type {
  ButtonModel,
  MenuModel,
  PlaygroundModel,
  SheetModel,
  SwitchModel,
  TabsModel,
  ToastModel,
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
  const c = previewConfig(config, model),
    imports = new Set(["SystemProvider", "defaultConfig"]),
    otherImports = new Set<string>();
  const t = words(language);
  let declarations = "",
    jsx = "";
  const recordEvent = "setEvent";
  if (component === "button") {
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
    jsx = `<Sheet\n        trigger={<Button variant="${p.triggerVariant}" size="${p.triggerSize}">{${json(p.triggerLabel)}}</Button>}\n        ${attribute("title", p.title)}\n        ${attribute("description", p.description)}\n        ${attribute("closeLabel", p.closeLabel)}\n        ${p.side === "auto" ? "" : `side="${p.side}"`}\n        ${p.mode === "controlled" ? "open={open}" : ""}\n        onOpenChange={(next) => { ${p.mode === "controlled" ? "setOpen(next); " : ""}${recordEvent}("onOpenChange: " + next); }}\n        ${p.footer ? `footer={<SheetClose asChild><Button>{${json(p.footerLabel)}}</Button></SheetClose>}` : ""}\n      >\n        <p dir="auto">{${json(p.children)}}</p>\n        <dl>\n          <div><dt>{${json(t("البريد الإلكتروني", "Email"))}}</dt><dd><bdi dir="ltr">hello@madar.example</bdi></dd></div>\n          <div><dt>{${json(t("الموقع الإلكتروني", "Website"))}}</dt><dd><bdi dir="ltr">https://madar.example</bdi></dd></div>\n        </dl>\n      </Sheet>`;
  } else {
    const p = model as ToastModel;
    imports.add("Button");
    imports.add("ToastProvider");
    imports.add("useToast");
    declarations = "const { toast } = useToast();";
    jsx = `<Button variant="secondary" onClick={() => {\n        toast(${JSON.stringify({ title: p.title, description: p.description, tone: p.tone, duration: p.duration }, null, 2)});\n        setEvent("toast: ${p.tone}");\n      }}>{${json(p.triggerLabel)}}</Button>`;
  }
  const importsCode = `import { useState${component === "button" && (model as ButtonModel).action === "simulate" ? ", useEffect, useRef" : ""} } from "react";\nimport { ${[...imports].join(", ")} } from "./system";\nimport type { SystemConfig${component === "button" && (model as ButtonModel).action === "simulate" ? ", ButtonState" : ""} } from "./system";\n${[...otherImports].join("\n")}\nimport "./system/tokens.css";\nimport "./system/components.css";`;
  const configCode = `const config: SystemConfig = {\n  ...defaultConfig,\n  theme: "${c.theme}",\n  direction: "${c.direction}",\n  density: "${c.density}",\n  accent: "${c.accent}",\n  typography: "${c.typography ?? "standard"}",\n  radius: ${c.radius},\n  reducedMotion: ${c.reducedMotion},\n};`;
  const inner = `function Demo() {\n  const [event, setEvent] = useState("");\n  ${declarations}\n  return (\n    <>\n      ${jsx}\n      <output aria-live="polite" dir="auto">{event}</output>\n    </>\n  );\n}`;
  const p = model as ToastModel;
  return `${importsCode}\n\n${configCode}\n\n${inner}\n\nexport default function Example() {\n  return (\n    <SystemProvider config={config}>\n      ${component === "toast" ? `<ToastProvider ${attribute("label", p.providerLabel)} ${attribute("closeLabel", p.closeLabel)}>\n        <Demo />\n      </ToastProvider>` : "<Demo />"}\n    </SystemProvider>\n  );\n}\n`;
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
      `اعثر أولًا على طِراز داخل المشروع الحالي. إذا لم تتمكن من العثور على النظام، أبلغ بذلك بوضوح وتوقف. انطلاقًا من جذر مشروع طِراز الذي عثرت عليه، اقرأ README.md لإرشادات الاستخدام وsrc/system/${entry.file} لمصدر المكوّن وsrc/system/index.ts للتصديرات وsrc/system/config.ts للإعدادات. جميع المسارات نسبية إلى ذلك الجذر، بما فيها src/main.tsx الذي يحمّل الخط المحلي. استخدم ${localize(entry.name, language)} بالخصائص والإعدادات الحالية كما في المثال أدناه. لا تضف مثبتًا أو CLI.`,
      `First locate Tiraz within the current project. If you cannot locate the system, clearly report that and stop. From the located Tiraz project root, read README.md for usage guidance, src/system/${entry.file} for the component source, src/system/index.ts for exports and src/system/config.ts for configuration. All paths are relative to that root, including src/main.tsx, which loads the local font. Use ${localize(entry.name, language)} with the exact current properties and system settings in the example below. Do not add an installer or CLI.`,
    ) +
    `\n\nSystemProvider: ${JSON.stringify(c)}\n\n${t("أنشئ src/Example.tsx تحت ذلك الجذر للمثال واربط أحداثه بتطبيقك.", "Create src/Example.tsx under that root for this example and connect its events to your application.")}\n\n\`\`\`tsx\n${generateCode(component, model, config, language)}\`\`\``
  );
}
