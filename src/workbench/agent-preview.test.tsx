import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { SystemProvider, defaultConfig } from "../system";
import { Playground } from "./Playground";
import { Workbench } from "./Workbench";
import { defaultPlaygrounds, normalizePlaygrounds } from "./model";
import { persist, storageKeys } from "./storage";
import { generateCode, generatePrompt } from "./generate";
const components = [
  "agent-task",
  "draft-review",
  "image-generation",
  "change-summary",
  "data-answer",
  "cited-answer",
  "task-starter",
  "ask-user-questions",
  "suggested-edits",
  "assistant-controls",
] as const;

it.each(components)(
  "shows Khayt inside the %s playground's existing header by default",
  (component) => {
    render(
      <SystemProvider config={defaultConfig}>
        <Playground
          component={component}
          model={defaultPlaygrounds("en")[component]}
          language="en"
          onPatch={vi.fn()}
          onEvent={vi.fn()}
          onButtonAction={vi.fn()}
        />
      </SystemProvider>,
    );
    const mascot = document.querySelector(".khayt");
    expect(mascot).toBeInTheDocument();
    expect(mascot?.closest('[data-zone="header"]')).not.toBeNull();
    expect(document.querySelector(".screen-agent-workspace")).toBeNull();
  },
);

it("switches identity and color without restarting or losing the chosen draft tone", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, {
    language: "en",
    active: "draft-review",
    settingsOpen: true,
  });
  render(<Workbench />);
  const settings = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  );
  const identity = within(
    settings.getByRole("group", { name: "Agent appearance" }),
  );
  const tone = screen.getByRole("radio", { name: "Formal" });
  await user.click(tone);
  await user.click(identity.getByRole("button", { name: "AI icon" }));
  expect(document.querySelector(".tz-draft-review .khayt")).toBeNull();
  expect(tone).toBeChecked();
  await user.click(identity.getByRole("button", { name: "Khayt" }));
  expect(document.querySelector(".tz-draft-review .khayt")).toHaveAttribute(
    "data-state",
    "waiting",
  );
  expect(tone).toBeChecked();
  await user.click(settings.getByRole("button", { name: "Ochre" }));
  expect(document.querySelector(".tz-draft-review")).toHaveStyle({
    "--agent-color": "#B59255",
  });
  expect(tone).toBeChecked();
});

it("includes the selected mascot and its source requirements in copied examples", () => {
  const model = defaultPlaygrounds("en")["agent-task"];
  const code = generateCode("agent-task", model, defaultConfig, "en");
  expect(code).toContain('from "./mascot/Khayt"');
  expect(code).toContain("getAgentPresentation=");
  expect(generatePrompt("agent-task", model, defaultConfig, "en")).toContain(
    "khayt-artwork.ts",
  );
});

it("keeps a typed request when its mascot appearance changes", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, {
    language: "en",
    active: "task-starter",
    settingsOpen: true,
  });
  render(<Workbench />);
  const request = within(
    document.querySelector(".tz-task-starter") as HTMLElement,
  ).getByRole("combobox", { name: "Your request" });
  await user.clear(request);
  await user.type(request, "Keep this request");
  const settings = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  );
  const identity = within(
    settings.getByRole("group", { name: "Agent appearance" }),
  );
  await user.click(identity.getByRole("button", { name: "AI icon" }));
  expect(request).toHaveValue("Keep this request");
  expect(
    document.querySelector(".tz-task-starter .tz-ai-mark"),
  ).toBeInTheDocument();
  await user.click(identity.getByRole("button", { name: "Khayt" }));
  expect(request).toHaveValue("Keep this request");
});

it("restores saved identity choices while migrating old settings and rejecting invalid colors", () => {
  const restored = normalizePlaygrounds(
    {
      "agent-task": { agentAppearance: "icon", agentColor: "#B59255" },
      "draft-review": { appearance: "plain" },
      "image-generation": {
        agentAppearance: "unknown",
        agentColor: "not a color",
      },
    },
    "en",
  );
  expect(restored["agent-task"]).toMatchObject({
    agentAppearance: "icon",
    agentColor: "#B59255",
  });
  expect(restored["draft-review"]).toMatchObject({
    appearance: "plain",
    agentAppearance: "mascot",
  });
  expect(restored["image-generation"]).toMatchObject({
    agentAppearance: "mascot",
    agentColor: "#946D91",
  });
});
it("omits the optional mascot runtime when original icons are selected", () => {
  const model = {
    ...defaultPlaygrounds("en")["agent-task"],
    agentAppearance: "icon" as const,
  };
  expect(generateCode("agent-task", model, defaultConfig, "en")).not.toContain(
    'from "./mascot/Khayt"',
  );
  expect(
    generatePrompt("agent-task", model, defaultConfig, "en"),
  ).not.toContain("khayt-artwork.ts");
});
