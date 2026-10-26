import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
import { Modal } from "./Modal";
import { Sheet } from "./Sheet";
import { Select } from "./Select";
import { DropdownMenu } from "./DropdownMenu";
import { DatePicker } from "./DatePicker";
import { ModelSelector } from "./ModelSelector";
import { ContextMeter } from "./ContextMeter";
import { InlineCitation } from "./Sources";
import { TaskStarter } from "./TaskStarter";
import { SystemContext } from "./useSystem";

const config = {
  ...defaultConfig,
  direction: "ltr" as const,
  numerals: "latn" as const,
};
const hosts: HTMLElement[] = [];
function host() {
  const element = document.createElement("div");
  document.body.append(element);
  hosts.push(element);
  return element;
}
afterEach(() => {
  hosts.splice(0).forEach((element) => element.remove());
  vi.restoreAllMocks();
});
const source = {
  id: "ledger",
  number: 1,
  title: "Ledger",
  description: "Ledger evidence",
};
const noop = () => {};
type User = ReturnType<typeof userEvent.setup>;
type PortalCase = {
  name: string;
  content: ReactNode;
  open: (user: User) => Promise<void>;
  role: "dialog" | "listbox" | "menu" | "tooltip";
  text: string;
};
const clickButton = (name: string | RegExp) => async (user: User) => {
  await user.click(screen.getByRole("button", { name }));
};
const openSelect = (name: string) => async (user: User) => {
  screen.getByRole("combobox", { name }).focus();
  await user.keyboard("{ArrowDown}");
};
const cases: PortalCase[] = [
  {
    name: "Modal",
    content: (
      <Modal
        trigger={<button>Open modal</button>}
        title="Modal details"
        description="Modal description"
        closeLabel="Close modal"
      >
        <p>Modal content</p>
      </Modal>
    ),
    open: clickButton("Open modal"),
    role: "dialog",
    text: "Modal content",
  },
  {
    name: "Sheet",
    content: (
      <Sheet
        trigger={<button>Open sheet</button>}
        title="Sheet details"
        description="Sheet description"
        closeLabel="Close sheet"
      >
        <p>Sheet content</p>
      </Sheet>
    ),
    open: clickButton("Open sheet"),
    role: "dialog",
    text: "Sheet content",
  },
  {
    name: "Select",
    content: (
      <Select
        aria-label="Status"
        options={[{ value: "active", label: "Active status" }]}
      />
    ),
    open: openSelect("Status"),
    role: "listbox",
    text: "Active status",
  },
  {
    name: "DropdownMenu",
    content: (
      <DropdownMenu
        trigger={<button>Actions</button>}
        items={[{ id: "copy", label: "Copy record" }]}
      />
    ),
    open: clickButton("Actions"),
    role: "menu",
    text: "Copy record",
  },
  {
    name: "DatePicker outer calendar",
    content: (
      <DatePicker label="Due date" defaultValue="2026-10-27" locale="en" />
    ),
    open: clickButton(/Due date/),
    role: "dialog",
    text: "2026",
  },
  {
    name: "ModelSelector",
    content: (
      <ModelSelector
        label="Assistant model"
        models={[{ id: "model", name: "Local model" }]}
        value="model"
        onValueChange={noop}
      />
    ),
    open: openSelect("Assistant model"),
    role: "listbox",
    text: "Local model",
  },
  {
    name: "ContextMeter",
    content: (
      <ContextMeter
        label="Usage"
        used={32}
        capacity={100}
        metadata="Context detail"
      />
    ),
    open: clickButton(/Usage/),
    role: "dialog",
    text: "Context detail",
  },
  {
    name: "Sources disclosure portal",
    content: (
      <InlineCitation
        source={source}
        labels={{ source: () => "Show citation" }}
      />
    ),
    open: clickButton("Show citation"),
    role: "dialog",
    text: "Ledger evidence",
  },
  {
    name: "Sources preview portal",
    content: (
      <InlineCitation
        source={source}
        mode="preview"
        labels={{ source: () => "Preview citation" }}
      />
    ),
    open: async (user) => {
      await user.tab();
    },
    role: "tooltip",
    text: "Ledger evidence",
  },
  {
    name: "TaskStarter mode/model menu",
    content: (
      <TaskStarter
        value=""
        onValueChange={noop}
        onSubmit={noop}
        modes={[{ id: "draft", label: "Draft mode" }]}
        mode="draft"
        onModeChange={noop}
        models={[{ id: "model", name: "Task model" }]}
        model="model"
        onModelChange={noop}
        labels={{ mode: "Task mode" }}
      />
    ),
    open: clickButton(/Task mode/),
    role: "menu",
    text: "Task model",
  },
];

describe("existing overlay paths with a pending provider destination", () => {
  it.each(cases)(
    "$name does not fall back to body, then opens in the supplied host",
    async ({ content, open, role, text }) => {
      const destination = host();
      const tree = (portalContainer: HTMLElement | null) => (
        <SystemProvider config={config} {...{ portalContainer }}>
          <p>Ordinary page content</p>
          {content}
        </SystemProvider>
      );
      const user = userEvent.setup();
      const view = render(tree(null));
      await open(user);
      expect(screen.getByText("Ordinary page content")).toBeVisible();
      expect(
        screen.queryByRole(role, { hidden: true }),
      ).not.toBeInTheDocument();
      expect(destination).toBeEmptyDOMElement();
      view.rerender(tree(destination));
      const popup = await screen.findByRole(role, { hidden: true });
      expect(popup).toHaveTextContent(text);
      expect(destination.querySelector(".tiraz-system")).toContainElement(
        popup,
      );
      expect(view.container).not.toContainElement(popup);
      view.rerender(tree(null));
      await waitFor(() =>
        expect(
          screen.queryByRole(role, { hidden: true }),
        ).not.toBeInTheDocument(),
      );
      expect(destination).toBeEmptyDOMElement();
    },
  );

  // This directly exercises the legacy context contract too, so a provider-only
  // workaround cannot hide an unguarded Radix Portal's document.body fallback.
  it.each(cases)(
    "$name also withholds content for a legacy null context",
    async ({ content, open, role }) => {
      render(
        <SystemContext.Provider value={{ config, container: null }}>
          {content}
        </SystemContext.Provider>,
      );
      await open(userEvent.setup());
      expect(
        screen.queryByRole(role, { hidden: true }),
      ).not.toBeInTheDocument();
    },
  );

  it("keeps DatePicker year choices inside the calendar and removes both portals when the host is withdrawn", async () => {
    // JSDOM has no geometry; use the established DatePicker anchor fixture.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1024);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(768);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 10,
      y: 10,
      left: 10,
      top: 10,
      right: 110,
      bottom: 50,
      width: 100,
      height: 40,
      toJSON() {
        return {};
      },
    });
    const destination = host();
    const user = userEvent.setup();
    const tree = (portalContainer: HTMLElement | null) => (
      <SystemProvider config={config} {...{ portalContainer }}>
        <DatePicker
          label="Appointment"
          locale="en"
          defaultValue="2026-10-27"
          yearRange={[2024, 2028]}
        />
      </SystemProvider>
    );
    const view = render(tree(null));
    await user.click(screen.getByRole("button", { name: /Appointment/ }));
    expect(
      screen.queryByRole("dialog", { hidden: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("listbox", { hidden: true }),
    ).not.toBeInTheDocument();
    view.rerender(tree(destination));
    const calendar = await screen.findByRole("dialog");
    const year = await within(calendar).findByRole("combobox", {
      name: /year/i,
    });
    year.focus();
    await user.keyboard("{ArrowDown}");
    const choices = await screen.findByRole("listbox", { hidden: true });
    expect(calendar).toContainElement(choices);
    expect(destination).toContainElement(choices);
    expect(
      within(choices).getByRole("option", { name: "2028", hidden: true }),
    ).toBeInTheDocument();
    view.rerender(tree(null));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { hidden: true }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("listbox", { hidden: true }),
      ).not.toBeInTheDocument();
    });
    expect(destination).toBeEmptyDOMElement();
  });
});

function MentionEntry({ onAdd }: { onAdd: (id: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <TaskStarter
      value={value}
      onValueChange={setValue}
      onSubmit={noop}
      mentionOptions={[{ id: "alpha", label: "Alpha record" }]}
      onAddContext={onAdd}
      labels={{ field: "Request", mention: "Mention record" }}
    />
  );
}

describe("TaskStarter custom mention portal", () => {
  it("keeps pending ARIA truthful and lets Escape reach its owner, then supports the ready picker", async () => {
    const destination = host();
    const user = userEvent.setup();
    const onEscape = vi.fn();
    const onAdd = vi.fn();
    const tree = (portalContainer: HTMLElement | null) => (
      <SystemProvider config={config} {...{ portalContainer }}>
        <div
          onKeyDown={(event) => {
            if (event.key === "Escape") onEscape();
          }}
        >
          <MentionEntry onAdd={onAdd} />
        </div>
      </SystemProvider>
    );
    const view = render(tree(null));
    const field = screen.getByRole("combobox", { name: "Request" });
    await user.type(field, "@");
    expect(
      screen.queryByRole("listbox", { hidden: true }),
    ).not.toBeInTheDocument();
    expect(field).toHaveAttribute("aria-expanded", "false");
    expect(field).not.toHaveAttribute("aria-activedescendant");
    expect(field).not.toHaveAttribute("aria-controls");
    expect(
      fireEvent.keyDown(field, {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    ).toBe(true);
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onAdd).not.toHaveBeenCalled();
    view.rerender(tree(destination));
    await user.type(field, "a");
    const list = await screen.findByRole("listbox", {
      name: "Mention record",
      hidden: true,
    });
    expect(destination).toContainElement(list);
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute("aria-expanded", "true");
    expect(field).toHaveAttribute("aria-controls", list.id);
    const option = within(list).getByRole("option", {
      name: "Alpha record",
      hidden: true,
    });
    expect(field).toHaveAttribute("aria-activedescendant", option.id);
    await user.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("listbox", { hidden: true }),
    ).not.toBeInTheDocument();
    expect(field).toHaveAttribute("aria-expanded", "false");
    expect(field).not.toHaveAttribute("aria-activedescendant");
    await user.type(field, "l");
    await screen.findByRole("listbox", { hidden: true });
    await user.keyboard("{Enter}");
    expect(onAdd).toHaveBeenCalledExactlyOnceWith("alpha");
    expect(field).toHaveFocus();
    expect(
      screen.queryByRole("listbox", { hidden: true }),
    ).not.toBeInTheDocument();
    await user.type(field, "@");
    await screen.findByRole("listbox", { hidden: true });
    view.rerender(tree(null));
    expect(
      screen.queryByRole("listbox", { hidden: true }),
    ).not.toBeInTheDocument();
    expect(field).toHaveAttribute("aria-expanded", "false");
    expect(field).not.toHaveAttribute("aria-activedescendant");
    expect(field).not.toHaveAttribute("aria-controls");
    await user.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledTimes(2);
  });

  it("does not use document.body for a legacy null context, or consume its Escape", async () => {
    const onEscape = vi.fn();
    render(
      <SystemContext.Provider value={{ config, container: null }}>
        <div
          onKeyDown={(event) => {
            if (event.key === "Escape") onEscape();
          }}
        >
          <MentionEntry onAdd={noop} />
        </div>
      </SystemContext.Provider>,
    );
    const user = userEvent.setup();
    const field = screen.getByRole("combobox", { name: "Request" });
    await user.type(field, "@");
    expect(
      screen.queryByRole("listbox", { hidden: true }),
    ).not.toBeInTheDocument();
    expect(field).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});

it("preserves a selected required Select's label and form value while its host is pending", () => {
  const destination = host();
  const tree = (portalContainer: HTMLElement | null) => (
    <SystemProvider portalContainer={portalContainer}>
      <form aria-label="Record">
        <Select
          aria-label="Status"
          name="status"
          required
          defaultValue="active"
          options={[
            { value: "active", label: "Active status" },
            { value: "draft", label: "Draft status" },
          ]}
        />
      </form>
    </SystemProvider>
  );
  const view = render(tree(destination));
  for (const target of [destination, null, destination]) {
    view.rerender(tree(target));
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Active status",
    );
    const form = screen.getByRole("form", {
      name: "Record",
    }) as HTMLFormElement;
    expect(new FormData(form).get("status")).toBe("active");
    expect(form.checkValidity()).toBe(true);
  }
});

it("describes a citation preview only while its actual content has a host", async () => {
  const destination = host();
  const tree = (portalContainer: HTMLElement | null) => (
    <SystemProvider portalContainer={portalContainer}>
      <InlineCitation
        source={source}
        mode="preview"
        labels={{ source: () => "Citation preview" }}
      />
    </SystemProvider>
  );
  const view = render(tree(null));
  await userEvent.tab();
  const trigger = screen.getByRole("button", { name: "Citation preview" });
  expect(trigger).not.toHaveAttribute("aria-describedby");
  view.rerender(tree(destination));
  const tip = await screen.findByRole("tooltip");
  expect(trigger).toHaveAttribute("aria-describedby", tip.id);
  view.rerender(tree(null));
  expect(trigger).not.toHaveAttribute("aria-describedby");
});

it.each(cases)(
  "preserves $name's existing body destination when no provider exists",
  async ({ content, open, role, text }) => {
    const view = render(content);
    await open(userEvent.setup());
    const popup = await screen.findByRole(role, { hidden: true });
    expect(popup).toHaveTextContent(text);
    expect(document.body).toContainElement(popup);
    expect(view.container).not.toContainElement(popup);
  },
);
