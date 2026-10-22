import { useId } from "react";
import type { ReactNode } from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import { ChartBarIcon } from "@phosphor-icons/react/dist/csr/ChartBar";
import { ChatCircleDotsIcon } from "@phosphor-icons/react/dist/csr/ChatCircleDots";
import { CompassIcon } from "@phosphor-icons/react/dist/csr/Compass";
import { DatabaseIcon } from "@phosphor-icons/react/dist/csr/Database";
import { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { PaletteIcon } from "@phosphor-icons/react/dist/csr/Palette";
import { RobotIcon } from "@phosphor-icons/react/dist/csr/Robot";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/csr/SlidersHorizontal";
import { SparkleIcon } from "@phosphor-icons/react/dist/csr/Sparkle";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { StackIcon } from "@phosphor-icons/react/dist/csr/Stack";
import type { Icon } from "@phosphor-icons/react";
import { Button } from "../system/Button";
import { screens } from "../examples/frame/screen";
import { navigationGroups, nestedParts } from "./catalog";
import type { Language } from "./i18n";
import { label, localize, words } from "./i18n";
import { illustrations } from "./illustrations";
import { SiteLink } from "./SiteLink";
import type { Navigate } from "./SiteLink";
import type { SiteRoute } from "./site-routes";

const sectionIcons: Record<string, Icon> = {
  screens: SquaresFourIcon,
  ask: ChatCircleDotsIcon,
  delegate: RobotIcon,
  create: SparkleIcon,
  understand: SlidersHorizontalIcon,
  forms: ListChecksIcon,
  files: FolderOpenIcon,
  navigation: CompassIcon,
  data: DatabaseIcon,
  display: BellIcon,
  overlays: StackIcon,
  charts: ChartBarIcon,
};

export function NavigationHeading({
  name,
  icon: SectionIcon,
  target,
  current,
  navigate,
}: {
  name: string;
  icon: Icon;
  target: SiteRoute;
  current: boolean;
  navigate: Navigate;
}) {
  return (
    <h2 className="component-nav-heading">
      <SiteLink
        className="component-nav-section"
        route={target}
        navigate={navigate}
        aria-current={current ? "page" : undefined}
      >
        <SectionIcon
          className="component-nav-section-icon"
          size={20}
          weight="duotone"
          aria-hidden="true"
          focusable="false"
        />
        <span>{name}</span>
      </SiteLink>
    </h2>
  );
}

function NavigationSection({
  name,
  icon,
  language,
  target,
  current,
  open,
  onToggle,
  navigate,
  resource = false,
  children,
}: {
  name: string;
  icon: Icon;
  language: Language;
  target: SiteRoute;
  current: boolean;
  open: boolean;
  onToggle: () => void;
  navigate: Navigate;
  resource?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const t = words(language);
  return (
    <div
      className={`component-nav-group${resource ? " docs-navigation-resources" : ""}`}
      role="group"
      aria-label={name}
    >
      <div className="component-nav-heading-row">
        <NavigationHeading
          name={name}
          icon={icon}
          target={target}
          current={current}
          navigate={navigate}
        />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className="component-nav-toggle"
          aria-label={`${name}: ${open ? t("طي القسم", "Collapse section") : t("توسيع القسم", "Expand section")}`}
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
        >
          <CaretDownIcon size={16} weight="regular" aria-hidden="true" />
        </Button>
      </div>
      <div
        id={id}
        className="component-nav-panel"
        data-open={open}
        aria-hidden={!open || undefined}
        inert={!open}
      >
        <div className="component-nav-clip">
          <div className="component-nav-items">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Gallery links navigate; adjacent disclosures only change their own list. */
export function ComponentNavigation({
  language,
  route,
  navigate,
  openSections,
  onToggleSection,
}: {
  language: Language;
  route: SiteRoute;
  navigate: Navigate;
  openSections: readonly string[];
  onToggleSection: (section: string) => void;
}) {
  const t = words(language);
  const active = route.kind === "component" ? route.id : undefined;
  const parent = nestedParts[active as keyof typeof nestedParts];
  return (
    <nav
      className="component-nav site-secondary"
      aria-label={label("components", language)}
    >
      {navigationGroups.map((group) => (
        <NavigationSection
          key={group.id}
          name={localize(group.name, language)}
          icon={sectionIcons[group.id]}
          language={language}
          target={{ kind: "library", category: group.id }}
          navigate={navigate}
          current={route.kind === "library" && route.category === group.id}
          open={openSections.includes(group.id)}
          onToggle={() => onToggleSection(group.id)}
        >
          {group.items.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={
                active === item.id || parent === item.id ? "page" : undefined
              }
              onClick={() => navigate({ kind: "component", id: item.id })}
            >
              {localize(item.name, language)}
            </button>
          ))}
          {group.id === "screens" &&
            screens.map((item) => (
              <button
                type="button"
                key={item.slug}
                aria-current={
                  route.kind === "screen" && route.slug === item.slug
                    ? "page"
                    : undefined
                }
                onClick={() => navigate({ kind: "screen", slug: item.slug })}
              >
                {localize(item.name, language)}
              </button>
            ))}
        </NavigationSection>
      ))}
      <NavigationSection
        name={t("الرسوم التوضيحية", "Illustrations")}
        icon={PaletteIcon}
        language={language}
        target={{ kind: "illustrations" }}
        navigate={navigate}
        current={route.kind === "illustrations" && !route.id}
        open={openSections.includes("illustrations")}
        onToggle={() => onToggleSection("illustrations")}
        resource
      >
        {illustrations.map((item) => (
          <SiteLink
            key={item.id}
            route={{ kind: "illustrations", id: item.id }}
            navigate={navigate}
            aria-current={
              route.kind === "illustrations" && route.id === item.id
                ? "page"
                : undefined
            }
          >
            {localize(item.name, language)}
          </SiteLink>
        ))}
      </NavigationSection>
    </nav>
  );
}
