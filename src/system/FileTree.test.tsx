import {
  act,
  fireEvent,
  render as baseRender,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FileTree } from "./FileTree";
import type { FileTreeNode } from "./FileTree";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const render = (
  ui: import("react").ReactNode,
  options?: import("@testing-library/react").RenderOptions,
) =>
  baseRender(ui, {
    wrapper: ({ children }) => (
      <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
        {children}
      </SystemProvider>
    ),
    ...options,
  });
const nodes: FileTreeNode[] = [
  {
    id: "src",
    kind: "folder",
    name: "src",
    children: [
      {
        id: "ui",
        kind: "folder",
        name: "components",
        children: [
          { id: "a", kind: "file", name: "App.tsx", metadata: "2 KB" },
          { id: "b", kind: "file", name: "Button.tsx" },
        ],
      },
      { id: "styles", kind: "file", name: "base.css" },
    ],
  },
  { id: "readme", kind: "file", name: "README.md" },
];
// jsdom's name calculator includes descendant groups in expanded parent names.
// Chrome AX naming is asserted in tests/browser/file-tree.mjs; locate each unit
// row by its own visible filename so this limitation cannot mask focus behavior.
const item = (name: string) =>
  screen
    .getByText(name, { selector: ".tz-file-tree-name > bdi" })
    .closest('[role="treeitem"]') as HTMLElement;
it("has one tab stop, visible-node navigation, distinct selection and host activation", async () => {
  const user = userEvent.setup(),
    activate = vi.fn(),
    select = vi.fn();
  render(
    <>
      <FileTree
        label="Project"
        nodes={nodes}
        onActivate={activate}
        onSelectedChange={select}
      />
      <button>After</button>
    </>,
  );
  await user.tab();
  expect(item("src")).toHaveFocus();
  await user.keyboard("{ArrowRight}{ArrowRight}");
  expect(item("components")).toHaveFocus();
  await user.keyboard("{ArrowRight}{ArrowDown}");
  expect(item("App.tsx")).toHaveFocus();
  expect(select).not.toHaveBeenCalled();
  expect(activate).not.toHaveBeenCalled();
  expect(item("App.tsx")).toHaveAccessibleDescription("2 KB");
  await user.keyboard(" ");
  expect(item("App.tsx")).toHaveAttribute("aria-selected", "true");
  expect(activate).not.toHaveBeenCalled();
  await user.keyboard("{ArrowDown}{Enter}");
  expect(activate).toHaveBeenCalledWith(
    nodes[0].kind === "folder" && nodes[0].children[0].kind === "folder"
      ? nodes[0].children[0].children[1]
      : null,
  );
  await user.keyboard("{End}");
  expect(item("README.md")).toHaveFocus();
  await user.keyboard("{Home}");
  expect(item("src")).toHaveFocus();
  expect(
    screen.getAllByRole("treeitem").filter((el) => el.tabIndex === 0),
  ).toHaveLength(1);
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
});
it("mirrors expansion and parent arrows in RTL and searches visible names", async () => {
  const user = userEvent.setup();
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <FileTree
        label="Project"
        nodes={nodes}
        defaultExpandedIds={["src", "ui"]}
      />
    </SystemProvider>,
  );
  await user.tab();
  await user.keyboard("{ArrowLeft}");
  expect(item("components")).toHaveFocus();
  await user.keyboard("{ArrowLeft}");
  expect(item("App.tsx")).toHaveFocus();
  await user.keyboard("{ArrowRight}");
  expect(item("components")).toHaveFocus();
  await user.keyboard("b");
  expect(item("Button.tsx")).toHaveFocus();
  await user.keyboard("b");
  expect(item("base.css")).toHaveFocus();
});
it("keeps controlled expansion and selection authoritative", async () => {
  const user = userEvent.setup(),
    expanded = vi.fn(),
    selected = vi.fn();
  const view = render(
    <FileTree
      label="Project"
      nodes={nodes}
      expandedIds={[]}
      selectedId={null}
      onExpandedChange={expanded}
      onSelectedChange={selected}
    />,
  );
  await user.click(item("src"));
  expect(expanded).toHaveBeenCalledWith(["src"]);
  expect(selected).toHaveBeenCalledWith("src");
  expect(item("src")).toHaveAttribute("aria-expanded", "false");
  expect(item("src")).toHaveAttribute("aria-selected", "false");
  view.rerender(
    <FileTree
      label="Project"
      nodes={nodes}
      expandedIds={["src"]}
      selectedId="src"
    />,
  );
  expect(item("src")).toHaveAttribute("aria-selected", "true");
  expect(item("components")).toBeVisible();
});
it("recovers a removed focused descendant to its nearest visible ancestor without stealing outside focus", () => {
  const view = render(
    <>
      <FileTree label="Project" nodes={nodes} expandedIds={["src", "ui"]} />
      <button>Outside</button>
    </>,
  );
  act(() => item("App.tsx").focus());
  view.rerender(
    <>
      <FileTree label="Project" nodes={nodes} expandedIds={["src"]} />
      <button>Outside</button>
    </>,
  );
  expect(item("components")).toHaveFocus();
  act(() => screen.getByRole("button").focus());
  view.rerender(
    <>
      <FileTree label="Project" nodes={nodes} expandedIds={[]} />
      <button>Outside</button>
    </>,
  );
  expect(screen.getByRole("button")).toHaveFocus();
});
it("recovers deletion, reordering and an empty data update without emitting selection", () => {
  const select = vi.fn();
  const view = render(
    <FileTree
      label="Project"
      nodes={nodes}
      defaultExpandedIds={["src", "ui"]}
      onSelectedChange={select}
    />,
  );
  act(() => item("App.tsx").focus());
  view.rerender(
    <FileTree label="Project" nodes={[nodes[1]]} onSelectedChange={select} />,
  );
  expect(item("README.md")).toHaveFocus();
  view.rerender(
    <FileTree label="Project" nodes={[]} onSelectedChange={select} />,
  );
  expect(screen.getByRole("tree")).toHaveFocus();
  expect(screen.getByText("No files")).toBeVisible();
  expect(select).not.toHaveBeenCalled();
});
it("does not reclaim an intentional blur to a nonfocusable outside target", () => {
  const view = render(
    <FileTree
      label="Project"
      nodes={nodes}
      defaultExpandedIds={["src", "ui"]}
    />,
  );
  act(() => item("App.tsx").focus());
  fireEvent.blur(item("App.tsx"), { relatedTarget: null });
  act(() => (document.activeElement as HTMLElement).blur());
  view.rerender(<FileTree label="Project" nodes={[nodes[1]]} />);
  expect(document.body).toHaveFocus();
});
it("keeps stable focus and selection across rename/reorder and does not search collapsed descendants", async () => {
  const user = userEvent.setup();
  const view = render(
    <FileTree label="Project" nodes={nodes} defaultSelectedId="readme" />,
  );
  await user.tab();
  expect(item("README.md")).toHaveFocus();
  const renamed = { ...nodes[1], name: "Guide.md" };
  view.rerender(
    <FileTree
      label="Project"
      nodes={[renamed, nodes[0]]}
      defaultSelectedId="readme"
    />,
  );
  expect(item("Guide.md")).toHaveFocus();
  expect(item("Guide.md")).toHaveAttribute("aria-selected", "true");
  await user.keyboard("a");
  expect(item("Guide.md")).toHaveFocus();
  await user.keyboard("{Home}{ArrowDown}");
  expect(item("src")).toHaveFocus();
});
it("preserves the current prefix match, wraps repeated letters and clears expired typeahead", async () => {
  const user = userEvent.setup();
  render(
    <FileTree
      label="Project"
      nodes={[
        { id: "a", kind: "file", name: "Alpha" },
        { id: "b", kind: "file", name: "Beta" },
        { id: "c", kind: "file", name: "Beagle" },
      ]}
    />,
  );
  await user.tab();
  await user.keyboard("be");
  expect(item("Beta")).toHaveFocus();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 710));
  });
  await user.keyboard("bb");
  expect(item("Beta")).toHaveFocus();
});
it("does not toggle ancestors on nested clicks, and exposes empty folders honestly", async () => {
  const user = userEvent.setup(),
    activate = vi.fn();
  render(
    <FileTree
      label="Project"
      nodes={[
        ...nodes,
        { id: "empty", kind: "folder", name: "Empty", children: [] },
      ]}
      defaultExpandedIds={["src", "ui"]}
      onActivate={activate}
    />,
  );
  await user.click(item("App.tsx"));
  expect(activate).toHaveBeenCalledTimes(1);
  expect(item("src")).toHaveAttribute("aria-expanded", "true");
  expect(item("components")).toHaveAttribute("aria-expanded", "true");
  await user.click(item("Empty"));
  expect(item("Empty")).not.toHaveAttribute("aria-expanded");
  expect(item("Empty")).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{ArrowRight}");
  expect(item("Empty")).toHaveFocus();
});
it("moves owned empty-root focus to arriving data while leaving outside focus alone", () => {
  const view = render(
    <>
      <FileTree label="Project" nodes={[]} />
      <button>Outside</button>
    </>,
  );
  act(() => screen.getByRole("tree").focus());
  view.rerender(
    <>
      <FileTree label="Project" nodes={[nodes[1]]} />
      <button>Outside</button>
    </>,
  );
  expect(item("README.md")).toHaveFocus();
  act(() => screen.getByRole("button").focus());
  view.rerender(
    <>
      <FileTree label="Project" nodes={[]} />
      <button>Outside</button>
    </>,
  );
  view.rerender(
    <>
      <FileTree label="Project" nodes={[nodes[1]]} />
      <button>Outside</button>
    </>,
  );
  expect(screen.getByRole("button")).toHaveFocus();
});

it("treats nested empty folders as end nodes for parent navigation and sibling expansion", async () => {
  const user = userEvent.setup();
  render(
    <FileTree
      label="Project"
      nodes={[
        {
          id: "p",
          kind: "folder",
          name: "Parent",
          children: [{ id: "e", kind: "folder", name: "Empty", children: [] }],
        },
      ]}
      defaultExpandedIds={["p"]}
    />,
  );
  await user.click(item("Empty"));
  expect(item("Empty")).not.toHaveAttribute("aria-expanded");
  await user.keyboard("*");
  expect(item("Empty")).not.toHaveAttribute("aria-expanded");
  await user.keyboard("{ArrowLeft}");
  expect(item("Parent")).toHaveFocus();
});
