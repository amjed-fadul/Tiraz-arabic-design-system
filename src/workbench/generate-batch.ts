import overlaySource from "../system/ai/examples/OverlayExamples.tsx?raw";
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
  if (component === "alert") {
    const p = model as AlertModel;
    imports = "Alert";
    jsx = `<Alert title={${json(p.title)}} description={${json(p.description)}} tone="${p.tone}" />`;
  } else if (component === "skeleton") {
    const p = model as SkeletonModel;
    imports = "Skeleton";
    jsx = `<Skeleton shape="${p.shape}" />`;
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
    jsx = `<AvatarGroup members={${members}} label={${json(ar ? "فريق المشروع" : "Project team")}} maxVisible={${p.maxVisible}} size="${p.size}" overflowLabel={count => ${ar ? "`${count} أعضاء إضافيون`" : "`${count} more members`"}} />`;
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
    imports = `EmptyState${illustration ? `, ${illustration}` : ""}`;
    jsx = `<EmptyState title={${json(p.title)}} description={${json(p.description)}} ${illustration ? `illustration={<${illustration} />}` : ""} />`;
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
