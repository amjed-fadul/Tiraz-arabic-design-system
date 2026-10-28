import { useState } from "react";
import {
  Sidebar,
  SidebarAction,
  SidebarContent,
  SidebarDisclosure,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarToggle,
} from "../../index";
/** `iconName` instead of an `icon` node: a plain string from `sidebarIconNames`. */
export function SidebarIconNameExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [current, setCurrent] = useState("home");
  const link = (id: string) => ({
    href: `#sidebar-icon-name-${id}`,
    active: current === id,
    onClick: () => setCurrent(id),
  });
  return (
    <Sidebar aria-label={t("مساحة العمل", "Workspace")}>
      <SidebarHeader>
        <SidebarToggle
          collapseLabel={t("طيّ التنقل", "Collapse navigation")}
          expandLabel={t("توسيع التنقل", "Expand navigation")}
        />
      </SidebarHeader>
      <SidebarContent aria-label={t("التنقل الرئيسي", "Primary")}>
        <SidebarGroup heading={t("العمل", "Work")}>
          <SidebarItem
            iconName="home"
            label={t("الرئيسية", "Home")}
            {...link("home")}
          />
          <SidebarItem
            iconName="chat"
            label={t("المحادثات", "Chats")}
            count={3}
            {...link("chat")}
          />
          <SidebarDisclosure
            iconName="folder"
            label={t("المشاريع", "Projects")}
            activeChild={current === "files"}
          >
            <SidebarItem
              iconName="file-text"
              label={t("الملفات", "Files")}
              {...link("files")}
            />
          </SidebarDisclosure>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarAction iconName="settings" label={t("الإعدادات", "Settings")} />
      </SidebarFooter>
    </Sidebar>
  );
}
