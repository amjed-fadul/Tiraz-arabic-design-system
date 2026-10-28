import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import {
  Archive,
  Bell,
  Bookmark,
  Building2,
  Calendar,
  ChartColumn,
  CircleHelp,
  Clock,
  Code,
  CreditCard,
  Database,
  Download,
  File,
  FileText,
  Folder,
  Globe,
  History,
  House,
  Image,
  Inbox,
  LayoutDashboard,
  Link,
  ListChecks,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

const directions = ["rtl", "ltr"] as const;
type Direction = (typeof directions)[number];

// DOM of the Sidebar family, with `icon` nodes, before `iconName` existed.
const before: Record<string, string> = JSON.parse(
  readFileSync(resolve("src/tests/sidebar-convenience-dom.json"), "utf8"),
);
function markup() {
  for (const child of [...document.body.children])
    if (child.localName === "div" && !child.childNodes.length) child.remove();
  const seen = new Map<string, string>();
  return document.body.innerHTML.replace(/_r_[0-9a-z]+_/g, (id) => {
    if (!seen.has(id)) seen.set(id, `r${seen.size + 1}`);
    return seen.get(id)!;
  });
}

// What each name stands for. Record keys make a missing or extra name a type
// error here, and the test below makes it a failure.
const expected = {
  home: House,
  dashboard: LayoutDashboard,
  inbox: Inbox,
  search: Search,
  bell: Bell,
  calendar: Calendar,
  bookmark: Bookmark,
  star: Star,
  clock: Clock,
  history: History,
  help: CircleHelp,
  file: File,
  "file-text": FileText,
  folder: Folder,
  image: Image,
  archive: Archive,
  download: Download,
  upload: Upload,
  link: Link,
  settings: Settings,
  user: User,
  users: Users,
  lock: Lock,
  "credit-card": CreditCard,
  building: Building2,
  chat: MessageSquare,
  mail: Mail,
  sparkles: Sparkles,
  chart: ChartColumn,
  tasks: ListChecks,
  database: Database,
  code: Code,
  tag: Tag,
  globe: Globe,
  plus: Plus,
  trash: Trash2,
} satisfies Record<Tiraz.SidebarIconName, LucideIcon>;
const icons: Record<string, LucideIcon> = expected;

const noop = () => {};
type Mode = "icon" | "name";
// The same icon, as a node (the original API) or by name.
const pick = (mode: Mode, name: Tiraz.SidebarIconName) => {
  const Icon = icons[name];
  return mode === "icon" ? { icon: <Icon size={18} /> } : { iconName: name };
};
function sidebar(direction: Direction, collapsed: boolean, mode: Mode) {
  return (
    <Tiraz.SystemProvider config={{ ...Tiraz.defaultConfig, direction }}>
      <Tiraz.Sidebar aria-label="Workspace" collapsed={collapsed}>
        <Tiraz.SidebarHeader>
          <Tiraz.SidebarToggle
            collapseLabel="Collapse navigation"
            expandLabel="Expand navigation"
          />
        </Tiraz.SidebarHeader>
        <Tiraz.SidebarContent aria-label="Primary">
          <Tiraz.SidebarGroup heading="Work">
            <Tiraz.SidebarItem
              href="#home"
              label="Home"
              active
              count={3}
              id="home-link"
              className="extra"
              {...pick(mode, "home")}
            />
            <Tiraz.SidebarItem
              href="#dashboard"
              label="Dashboard"
              count="9+"
              aria-label="Dashboard, 9 or more"
              {...pick(mode, "dashboard")}
            />
            <Tiraz.SidebarDisclosure
              label="Projects"
              count={2}
              activeChild
              defaultOpen
              data-testid="projects"
              {...pick(mode, "folder")}
            >
              <Tiraz.SidebarItem
                href="#team"
                label="Team"
                active
                {...pick(mode, "users")}
              />
              <Tiraz.SidebarItem
                href="#files"
                label="Files"
                {...pick(mode, "file-text")}
              />
            </Tiraz.SidebarDisclosure>
          </Tiraz.SidebarGroup>
        </Tiraz.SidebarContent>
        <Tiraz.SidebarFooter>
          <Tiraz.SidebarAction
            label="Chat"
            count={0}
            onClick={noop}
            {...pick(mode, "chat")}
          />
          <Tiraz.SidebarAction
            label="Settings"
            type="submit"
            {...pick(mode, "settings")}
          />
        </Tiraz.SidebarFooter>
      </Tiraz.Sidebar>
    </Tiraz.SystemProvider>
  );
}

// `icon` may still be an explicit empty node.
function emptyIcons(direction: Direction) {
  return (
    <Tiraz.SystemProvider config={{ ...Tiraz.defaultConfig, direction }}>
      <Tiraz.Sidebar aria-label="Workspace">
        <Tiraz.SidebarContent aria-label="Primary">
          <Tiraz.SidebarItem href="#a" label="Null" icon={null} />
          <Tiraz.SidebarItem href="#b" label="Undefined" icon={undefined} />
          <Tiraz.SidebarAction label="Action" icon={null} />
          <Tiraz.SidebarDisclosure label="Group" icon={undefined}>
            <Tiraz.SidebarItem href="#c" label="Child" icon={null} />
          </Tiraz.SidebarDisclosure>
        </Tiraz.SidebarContent>
      </Tiraz.Sidebar>
    </Tiraz.SystemProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe.each(directions)("Sidebar markup in %s", (direction) => {
  const cases = [
    [`sidebar-${direction}-expanded`, false],
    [`sidebar-${direction}-collapsed`, true],
  ] as const;
  it.each(cases)(
    "%s with icon nodes is unchanged from the capture",
    (key, collapsed) => {
      render(sidebar(direction, collapsed, "icon"));
      expect(markup()).toBe(before[key]);
    },
  );
  it.each(cases)(
    "%s with iconName equals the icon-node markup",
    (key, collapsed) => {
      render(sidebar(direction, collapsed, "name"));
      expect(markup()).toBe(before[key]);
    },
  );
  it(`keeps empty icons as they were (${direction})`, () => {
    render(emptyIcons(direction));
    expect(markup()).toBe(before[`sidebar-${direction}-no-icon`]);
  });
});

it("captures exactly the cases compared", () => {
  expect(Object.keys(before).sort()).toEqual(
    directions
      .flatMap((d) => [
        `sidebar-${d}-expanded`,
        `sidebar-${d}-collapsed`,
        `sidebar-${d}-no-icon`,
      ])
      .sort(),
  );
});

describe("iconName", () => {
  it("exports the closed set as a list and a type", () => {
    const names = Tiraz.sidebarIconNames;
    expect(names.length).toBeGreaterThanOrEqual(30);
    expect(names.length).toBeLessThanOrEqual(40);
    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort()).toEqual(Object.keys(expected).sort());
    for (const name of names) expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    const first: Tiraz.SidebarIconName = names[0];
    expect(first).toBe("home");
  });

  it("maps every name to its own lucide icon, drawn like an icon node", () => {
    const seen = new Set<string>();
    for (const name of Tiraz.sidebarIconNames) {
      const view = render(
        <Tiraz.SystemProvider>
          <Tiraz.SidebarItem href="#x" label="X" iconName={name} />
        </Tiraz.SystemProvider>,
      );
      const slot = view.container.querySelector(".tz-sidebar-icon")!;
      expect(slot).toHaveAttribute("aria-hidden", "true");
      expect(slot.children).toHaveLength(1);
      const drawn = slot.innerHTML;
      view.unmount();
      const Icon = icons[name];
      const node = render(
        <Tiraz.SystemProvider>
          <Tiraz.SidebarItem href="#x" label="X" icon={<Icon size={18} />} />
        </Tiraz.SystemProvider>,
      );
      expect(drawn, name).toBe(
        node.container.querySelector(".tz-sidebar-icon")!.innerHTML,
      );
      node.unmount();
      seen.add(drawn);
    }
    expect(seen.size).toBe(Tiraz.sidebarIconNames.length);
  });

  it("works on an item, an action and a disclosure, in the rail too", () => {
    for (const collapsed of [false, true]) {
      const view = render(
        <Tiraz.SystemProvider>
          <Tiraz.Sidebar aria-label="Workspace" collapsed={collapsed}>
            <Tiraz.SidebarItem href="#a" label="Item" iconName="home" />
            <Tiraz.SidebarAction label="Action" iconName="plus" />
            <Tiraz.SidebarDisclosure label="Group" iconName="folder">
              <Tiraz.SidebarItem href="#b" label="Child" iconName="file" />
            </Tiraz.SidebarDisclosure>
          </Tiraz.Sidebar>
        </Tiraz.SystemProvider>,
      );
      expect(
        view.container.querySelectorAll(".tz-sidebar-icon svg"),
      ).toHaveLength(4);
      expect(view.getByRole("link", { name: "Item" })).toBeVisible();
      expect(view.getByRole("button", { name: "Action" })).toBeVisible();
      expect(view.getByRole("button", { name: "Group" })).toBeVisible();
      view.unmount();
    }
  });

  it.each([
    [
      "SidebarItem",
      (extra: object) => (
        <Tiraz.SidebarItem
          href="#a"
          label="A"
          {...(extra as { icon: ReactNode })}
        />
      ),
    ],
    [
      "SidebarAction",
      (extra: object) => (
        <Tiraz.SidebarAction label="A" {...(extra as { icon: ReactNode })} />
      ),
    ],
    [
      "SidebarDisclosure",
      (extra: object) => (
        <Tiraz.SidebarDisclosure label="A" {...(extra as { icon: ReactNode })}>
          Child
        </Tiraz.SidebarDisclosure>
      ),
    ],
  ])("%s needs exactly one of icon and iconName", (name, part) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const show = (extra: object) =>
      render(<Tiraz.SystemProvider>{part(extra)}</Tiraz.SystemProvider>);
    expect(() => show({ icon: <span />, iconName: "home" })).toThrow(
      `${name}: pass icon or iconName, not both.`,
    );
    expect(() => show({ icon: null, iconName: "home" })).toThrow(
      `${name}: pass icon or iconName, not both.`,
    );
    expect(() => show({})).toThrow(`${name} needs an icon or an iconName.`);
    expect(() => show({ iconName: "nope" })).toThrow(
      `${name}: unknown iconName "nope". Use one of sidebarIconNames.`,
    );
    // One of the two is enough, and an explicit empty icon still counts.
    expect(() => show({ iconName: "home" })).not.toThrow();
    expect(() => show({ icon: <span /> })).not.toThrow();
    expect(() => show({ icon: null })).not.toThrow();
    // React leaves an undefined prop out, so it never conflicts.
    expect(() => show({ icon: undefined, iconName: "home" })).not.toThrow();
  });

  it("checks the rule at compile time", () => {
    const bad = [
      // @ts-expect-error both icon and iconName
      <Tiraz.SidebarItem
        href="#a"
        label="A"
        icon={<span />}
        iconName="home"
        key="1"
      />,
      // @ts-expect-error neither icon nor iconName
      <Tiraz.SidebarItem href="#a" label="A" key="2" />,
      // @ts-expect-error a name outside the closed set
      <Tiraz.SidebarItem href="#a" label="A" iconName="nope" key="3" />,
      // @ts-expect-error neither on an action
      <Tiraz.SidebarAction label="A" key="4" />,
      // @ts-expect-error both on a disclosure
      <Tiraz.SidebarDisclosure
        label="A"
        icon={<span />}
        iconName="home"
        key="5"
      >
        Child
      </Tiraz.SidebarDisclosure>,
    ];
    expect(bad).toHaveLength(5);
    const ok: ReactNode[] = [
      <Tiraz.SidebarItem href="#a" label="A" icon={<span />} key="a" />,
      <Tiraz.SidebarItem href="#a" label="A" icon={null} key="b" />,
      <Tiraz.SidebarItem href="#a" label="A" iconName="home" key="c" />,
      <Tiraz.SidebarAction label="A" iconName="plus" key="d" />,
    ];
    expect(ok).toHaveLength(4);
  });
});
