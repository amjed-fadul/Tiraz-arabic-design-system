import structureSource from "../system/ai/examples/StructureExamples.tsx?raw";
import type {
  CardModel,
  AccordionModel,
  BreadcrumbsModel,
  PaginationModel,
} from "./model";
import overlaySource from "../system/ai/examples/OverlayExamples.tsx?raw";
import skeletonSource from "../system/ai/examples/SkeletonExample.tsx?raw";
import type { SystemConfig } from "../system";
import { teamMembers } from "../system/ai/examples/team";
import type {
  AlertModel,
  SkeletonModel,
  ProgressModel,
  SpinnerModel,
  AvatarModel,
  AvatarGroupModel,
  TooltipModel,
  ModalModel,
  EmptyStateModel,
  PlaygroundModel,
} from "./model";
import type { Language } from "./i18n";
export function generateBatchCode(
  component: string,
  model: PlaygroundModel,
  config: SystemConfig,
  language: Language,
) {
  const json = JSON.stringify;
  const ar = language === "ar";
  let imports = "",
    extra = "",
    source = "",
    jsx = "";
  if (["card", "accordion", "breadcrumbs", "pagination"].includes(component)) {
    const name = {
      card: "CardExample",
      accordion: "AccordionExample",
      breadcrumbs: "BreadcrumbsExample",
      pagination: "PaginationExample",
    }[component as "card" | "accordion" | "breadcrumbs" | "pagination"];
    const start = structureSource.indexOf(`export function ${name}`);
    const end = structureSource.indexOf("export function", start + 1);
    source =
      'type Language = "ar" | "en";\n' +
      structureSource.slice(start, end === -1 ? undefined : end);
    imports =
      component === "card"
        ? "Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button"
        : component === "accordion"
          ? "Accordion"
          : component === "breadcrumbs"
            ? "Breadcrumbs"
            : "Pagination, numberLocale, useSystem";
    extra =
      component === "card"
        ? 'import { useId, useState } from "react";'
        : component === "breadcrumbs"
          ? 'import { useId } from "react";'
          : 'import { useState } from "react";';
    if (component === "card") {
      const p = model as CardModel;
      jsx = `<CardExample language="${language}" title={${json(p.title)}} description={${json(p.description)}} actions={${p.actions}} />`;
    }
    if (component === "accordion") {
      const p = model as AccordionModel;
      jsx = `<AccordionExample language="${language}" controlled={${p.mode === "controlled"}} collapsible={${p.collapsible}} defaultOpen={${p.defaultOpen}} />`;
    }
    if (component === "breadcrumbs") {
      const p = model as BreadcrumbsModel;
      jsx = `<BreadcrumbsExample language="${language}" label={${json(p.label)}} current={${json(p.current)}} />`;
    }
    if (component === "pagination") {
      const p = model as PaginationModel;
      jsx = `<PaginationExample language="${language}" initialPage={${p.page}} totalPages={${p.totalPages}} />`;
    }
  } else if (component === "alert") {
    const p = model as AlertModel;
    const action = p.actionLabel.trim();
    imports = action ? "Alert, Button" : "Alert";
    jsx = `<Alert title={${json(p.title)}} description={${json(p.description)}} tone="${p.tone}"${action ? ` action={<Button variant="secondary" onClick={() => {}}>{${json(action)}}</Button>}` : ""} />`;
  } else if (component === "skeleton") {
    const p = model as SkeletonModel;
    imports = "Avatar, Skeleton, useSystem";
    extra =
      'import { useEffect, useState } from "react";\nimport saraPortrait from "./system/ai/assets/sara.jpg";';
    source = skeletonSource.replace(/^import[\s\S]*?;\n/gm, "");
    jsx = `<SkeletonExample language="${language}" shape="${p.shape}" />`;
  } else if (component === "progress") {
    const p = model as ProgressModel;
    imports = "Progress";
    jsx = `<Progress label={${json(p.label)}} value={${p.indeterminate ? "null" : p.value}} showValue={${p.showValue}} locale="${language}" />`;
  } else if (component === "spinner") {
    const p = model as SpinnerModel;
    imports = "Spinner";
    jsx = p.decorative
      ? `<div role="status" style={{display:"flex",alignItems:"center",gap:"var(--space-2)"}}><Spinner decorative size="${p.size}" /><span>{${json(p.label)}}</span></div>`
      : `<Spinner label={${json(p.label)}} size="${p.size}" />`;
  } else if (component === "avatar") {
    const p = model as AvatarModel;
    imports = "Avatar";
    if (p.appearance === "photo" && !p.src.trim())
      extra = 'import saraPortrait from "./system/ai/assets/sara.jpg";';
    const photo =
      p.appearance === "photo"
        ? `src={${p.src.trim() ? json(p.src.trim()) : "saraPortrait"}}`
        : "";
    jsx = `<Avatar ${photo} name={${json(p.name)}} fallback={${json(p.fallback)}} size="${p.size}" />`;
  } else if (component === "avatar-group") {
    const p = model as AvatarGroupModel;
    imports = "AvatarGroup";
    if (p.appearance === "mixed")
      extra =
        'import saraPortrait from "./system/ai/assets/sara.jpg";\nimport omarPortrait from "./system/ai/assets/omar.jpg";';
    const members =
      p.appearance === "mixed"
        ? `${json(teamMembers(language))}.map(member => ({ ...member, src: member.id === "sara" ? saraPortrait : member.id === "omar" ? omarPortrait : undefined }))`
        : json(teamMembers(language));
    const group = (overflow: string) =>
      `<AvatarGroup members={${members}} label={${json(ar ? "فريق المشروع" : "Project team")}} maxVisible={${p.maxVisible}} size="${p.size}" overflowLabel={count => ${overflow}} />`;
    if (ar) {
      // Arabic copy spells the count in SystemConfig.numerals, so it needs the
      // system config; the wrapper keeps the hook inside the provider.
      imports = "AvatarGroup, numberLocale, useSystem";
      source = `const arabicPlural = new Intl.PluralRules("ar");
/** Arabic counts agree with the noun: one, the dual, 3–10, then 11 and up. */
function arabicOthers(count: number, digits: Intl.NumberFormat) {
  switch (arabicPlural.select(count)) {
    case "one":
      return "عضو آخر";
    case "two":
      return "عضوان آخران";
    case "few":
      return \`\${digits.format(count)} أعضاء آخرون\`;
    case "many":
      return \`\${digits.format(count)} عضوًا آخر\`;
    default:
      return \`\${digits.format(count)} عضو آخر\`;
  }
}
function TeamExample() {
  const number = new Intl.NumberFormat(numberLocale(useSystem().config, "ar"));
  return ${group("arabicOthers(count, number)")};
}
`;
      jsx = "<TeamExample />";
    } else jsx = group("`${count} more members`");
  } else if (component === "tooltip") {
    const p = model as TooltipModel;
    imports = "Tooltip, Button";
    extra = 'import { useState } from "react";';
    source = overlaySource
      .slice(
        overlaySource.indexOf("export function TooltipExample"),
        overlaySource.indexOf("export function ModalExample"),
      )
      .replace("Language", '"ar" | "en"');
    jsx = `<TooltipExample language="${language}" content={${json(p.content)}} />`;
  } else if (component === "modal") {
    const p = model as ModalModel;
    imports = "Modal, Button, Select, DropdownMenu, Tooltip";
    extra =
      'import { useRef, useState } from "react";\nimport { Close } from "@radix-ui/react-dialog";';
    source = overlaySource
      .slice(overlaySource.indexOf("export function ModalExample"))
      .replace("Language", '"ar" | "en"');
    jsx = `<ModalExample language="${language}" title={${json(p.title)}} description={${json(p.description)}} footer={${p.footer}} controlled={${p.mode === "controlled"}} />`;
  } else {
    const p = model as EmptyStateModel;
    const illustration = {
      "no-records": "NoRecordsIllustration",
      "no-results": "NoSearchResultsIllustration",
      "getting-started": "GettingStartedIllustration",
      none: "",
    }[p.illustration];
    const action = p.actionLabel.trim();
    imports = `EmptyState${illustration ? `, ${illustration}` : ""}${action ? ", Button" : ""}`;
    jsx = `<EmptyState title={${json(p.title)}} description={${json(p.description)}} ${illustration ? `illustration={<${illustration} />}` : ""}${action ? ` action={<Button variant="secondary" onClick={() => {}}>{${json(action)}}</Button>}` : ""} />`;
  }
  return `${extra}
import { SystemProvider, defaultConfig, ${imports} } from "./system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./system/tokens.css";
import "./system/components.css";
${source}
export default function Example() {
  return <div lang="${language}"><SystemProvider config={{ ...defaultConfig, ...${json(config)} }}>${jsx}</SystemProvider></div>;
}
`;
}
