import { render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { Workbench } from "../Workbench";
import { persist, storageKeys } from "../storage";
import { readSiteRoute, routePath } from "../site-routes";
import { sectionEntries } from "../navigation-model";
import { foundationOrder } from "./foundation-order";
import { TokenRow, TokenTable } from "./TokenRow";
import { useTokenValues } from "./useTokenValues";

afterEach(() => window.history.replaceState({}, "", "/"));
function at(path: string, language: "ar" | "en" = "en") {
  persist(storageKeys.documentation, { language });
  window.history.replaceState({}, "", path);
  return render(<Workbench />);
}
const saved = { active: "button" } as never;

it("parses and prints the /foundations routes", () => {
  for (const id of [
    "get-started",
    "colors",
    "typography",
    "spacing",
    "shape",
    "arabic-rtl",
  ] as const) {
    expect(routePath({ kind: "foundation", id })).toBe(`/foundations/${id}`);
    expect(
      readSiteRoute(new URL(`http://x/foundations/${id}/`), saved),
    ).toEqual({ kind: "foundation", id });
  }
  expect(readSiteRoute(new URL("http://x/foundations"), saved)).toEqual({
    kind: "foundation",
    id: "get-started",
  });
  expect(readSiteRoute(new URL("http://x/foundations/nope"), saved)).toEqual({
    kind: "not-found",
  });
});

it.each([
  [
    "en",
    "Foundations",
    [
      "Get started",
      "Installation",
      "Colors",
      "Typography",
      "Spacing",
      "Shape and elevation",
      "Arabic and RTL",
      "Changelog",
    ],
  ],
  [
    "ar",
    "الأسس",
    [
      "ابدأ هنا",
      "التثبيت",
      "الألوان",
      "الخطوط",
      "المسافات",
      "الأشكال والظلال",
      "العربية والاتجاه",
      "سجل التغييرات",
    ],
  ],
] as const)(
  "lists the Foundations group in order in %s, marking the current page",
  (language, name, labels) => {
    at("/foundations/colors", language);
    const nav = screen.getByRole("navigation", { name });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([...labels]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      foundationOrder.map((entry) => routePath(entry.route)),
    );
    expect(links.filter((link) => link.hasAttribute("aria-current"))).toEqual([
      links[2],
    ]);
    expect(
      screen.getByText(language === "ar" ? "المكتبة" : "Library"),
    ).toBeVisible();
  },
);

it("keeps Installation on /start and titles the document", () => {
  at("/start");
  const nav = screen.getByRole("navigation", { name: "Foundations" });
  expect(
    within(nav).getByRole("link", { name: "Installation" }),
  ).toHaveAttribute("aria-current", "page");
  expect(document.title).toBe("Tiraz · Installation");
});

it.each([
  ["get-started", undefined, "Installation"],
  ["colors", "Installation", "Typography"],
  ["arabic-rtl", "Shape and elevation", "Changelog"],
] as const)("%s links Previous %s and Next %s", async (id, prev, next) => {
  at(`/foundations/${id}`);
  const pager = screen.getByRole("navigation", {
    name: "Previous and next pages",
  });
  const links = within(pager).getAllByRole("link");
  expect(links).toHaveLength(prev ? 2 : 1);
  if (prev)
    expect(
      within(pager).getByRole("link", { name: /Previous/ }),
    ).toHaveTextContent(prev);
  const nextLink = within(pager).getByRole("link", { name: /Next/ });
  expect(nextLink).toHaveTextContent(next);
  await userEvent.click(nextLink);
  expect(document.title).toBe(`Tiraz · ${next}`);
});

it("uses Arabic pager labels and the page title in the document", () => {
  at("/foundations/colors", "ar");
  expect(document.title).toBe("طِراز · الألوان");
  const pager = screen.getByRole("navigation", {
    name: "الصفحة السابقة والتالية",
  });
  expect(within(pager).getByText("السابق")).toBeVisible();
  expect(within(pager).getByText("التالي")).toBeVisible();
});

it("shows the sidebar's section counts on Get started", () => {
  at("/foundations/get-started");
  const main = within(screen.getByRole("main"));
  const section = main.getByRole("heading", {
    name: "What's inside",
  }).parentElement!;
  const counts = within(section)
    .getAllByRole("listitem")
    .map((item) => item.textContent);
  const expected = (["components", "ai", "screens"] as const).map((key) =>
    String(sectionEntries(key, "en").length),
  );
  const labels = ["Components", "AI interfaces", "Screens"];
  expect(
    counts.map((text, i) => [text!.replace(labels[i], ""), labels[i]]),
  ).toEqual(expected.map((count, i) => [count, labels[i]]));
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  for (const [i, name] of ["Components", "AI interfaces", "Screens"].entries())
    expect(
      nav.getByRole("button", { name }).querySelector(".component-nav-count")
        ?.textContent,
    ).toBe(expected[i]);
});

it("links both Get started cards to Installation", () => {
  at("/foundations/get-started");
  const main = within(screen.getByRole("main"));
  const links = main.getAllByRole("link", { name: "See installation" });
  expect(links).toHaveLength(2);
  for (const link of links) expect(link).toHaveAttribute("href", "/start");
  expect(main.getByText("tiraz update")).toBeVisible();
});

it("renders a token row with named copy buttons", () => {
  render(
    <TokenTable language="en" label="Text">
      <TokenRow
        language="en"
        name="--text"
        light="#232a26"
        dark="#f4f6f4"
        use="Body text"
        badge={<span>AAA</span>}
      />
    </TokenTable>,
  );
  expect(screen.getByRole("table", { name: "Text" })).toBeVisible();
  expect(screen.getByText("--text")).toBeVisible();
  for (const name of [
    "Copy --text",
    "Copy --text light value",
    "Copy --text dark value",
  ])
    expect(screen.getByRole("button", { name })).toBeVisible();
  expect(screen.getByText("#232a26")).toBeVisible();
  expect(screen.getByText("AAA")).toBeVisible();
});

it("reads one light and dark entry per token, leaving no scope behind", () => {
  const { result } = renderHook(() => useTokenValues(["--text", "--surface"]));
  expect(result.current.map((item) => item.name)).toEqual([
    "--text",
    "--surface",
  ]);
  for (const item of result.current) {
    expect(typeof item.light).toBe("string");
    expect(typeof item.dark).toBe("string");
  }
  expect(document.querySelector(".tiraz-system")).toBeNull();
});
