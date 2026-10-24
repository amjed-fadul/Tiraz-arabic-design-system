import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { SiteAnalytics } from "./SiteAnalytics";
import { Workbench } from "./workbench/Workbench";

function pageviews() {
  return window.vaq?.filter(([event]) => event === "pageview") ?? [];
}

beforeEach(() => {
  vi.stubEnv("PROD", true);
  window.history.replaceState({}, "", "/library/components/button");
  delete window.va;
  delete window.vaq;
});
afterEach(() => {
  cleanup();
  document
    .querySelectorAll('script[data-sdkn="@vercel/analytics/react"]')
    .forEach((el) => el.remove());
  delete window.va;
  delete window.vaq;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("reports the route template and path when the workbench changes pages", () => {
  const { rerender } = render(
    <SiteAnalytics path="/library/components/button" />,
  );
  rerender(<SiteAnalytics path="/library/components/input" />);
  rerender(<SiteAnalytics path="/library/screens/invoices" />);
  expect(pageviews()).toEqual([
    [
      "pageview",
      {
        route: "/library/components/[component]",
        path: "/library/components/button",
      },
    ],
    [
      "pageview",
      {
        route: "/library/components/[component]",
        path: "/library/components/input",
      },
    ],
    [
      "pageview",
      { route: "/library/screens/[screen]", path: "/library/screens/invoices" },
    ],
  ]);
  expect(
    document.querySelector('script[data-sdkn="@vercel/analytics/react"]'),
  ).toHaveAttribute("data-disable-auto-track", "1");
});

it("does not create more pageviews for rerenders, filters, or hash changes", () => {
  const { rerender } = render(<SiteAnalytics path="/library?category=forms" />);
  rerender(<SiteAnalytics path="/library?category=forms" />);
  rerender(<SiteAnalytics path="/library?category=screens#preview" />);
  expect(pageviews()).toEqual([
    ["pageview", { route: "/library", path: "/library" }],
  ]);
});

it.each([
  ["/", "/", "/"],
  ["/landing.html#explore", "/", "/"],
  ["/start", "/start", "/start"],
  ["/illustrations", "/illustrations", "/illustrations"],
  [
    "/illustrations/khayt",
    "/illustrations/[illustration]",
    "/illustrations/khayt",
  ],
  ["/examples/invoices", "/examples/[screen]", "/examples/invoices"],
  [
    "/examples/playground/button",
    "/examples/playground/[component]",
    "/examples/playground/button",
  ],
])(
  "attributes %s to its canonical page and route",
  (path, route, canonical) => {
    render(<SiteAnalytics path={path} />);
    expect(pageviews()).toEqual([["pageview", { route, path: canonical }]]);
  },
);

it("uses the current path on standalone entry points", () => {
  window.history.replaceState({}, "", "/examples/dashboard");
  render(<SiteAnalytics />);
  expect(pageviews()).toEqual([
    ["pageview", { route: "/examples/[screen]", path: "/examples/dashboard" }],
  ]);
});

it("keeps development visits out of analytics", () => {
  vi.stubEnv("PROD", false);
  render(<SiteAnalytics />);
  expect(pageviews()).toEqual([]);
  expect(
    document.querySelector('script[data-sdkn="@vercel/analytics/react"]'),
  ).toBeNull();
});

it("does not count an embedded example as a separate visit", () => {
  vi.spyOn(window, "self", "get").mockReturnValue(
    {} as Window & typeof globalThis,
  );
  render(<SiteAnalytics />);
  expect(pageviews()).toEqual([]);
  expect(
    document.querySelector('script[data-sdkn="@vercel/analytics/react"]'),
  ).toBeNull();
});

it("records real sidebar navigation and browser Back without remounting analytics", async () => {
  localStorage.setItem(
    "tiraz.documentation.v2",
    JSON.stringify({ language: "en" }),
  );
  render(<Workbench />);
  expect(pageviews()).toHaveLength(1);
  expect(screen.getByRole("link", { name: "طِراز" })).toHaveAttribute(
    "href",
    "/",
  );
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "Components" })).getByRole(
      "link",
      { name: "Input" },
    ),
  );
  expect(window.location.pathname).toBe("/library/components/input");
  expect(pageviews()).toHaveLength(2);
  expect(pageviews().at(-1)).toEqual([
    "pageview",
    {
      route: "/library/components/[component]",
      path: "/library/components/input",
    },
  ]);
  act(() => window.history.back());
  await waitFor(() =>
    expect(window.location.pathname).toBe("/library/components/button"),
  );
  expect(pageviews()).toHaveLength(3);
  expect(pageviews().at(-1)).toEqual([
    "pageview",
    {
      route: "/library/components/[component]",
      path: "/library/components/button",
    },
  ]);
});
