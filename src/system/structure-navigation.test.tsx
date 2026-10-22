import { createRef, useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import * as System from "./index";
const {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Accordion,
  Breadcrumbs,
  Pagination,
} = System;
const items = [
  { value: "guide", label: "Guide", content: <a href="#guide">Read guide</a> },
  {
    value: "unavailable",
    label: "Unavailable",
    content: "Disabled content",
    disabled: true,
  },
  { value: "delivery", label: "Delivery", content: "Delivery details" },
];
const labels = {
  navigation: "Result pages",
  previous: "Previous",
  next: "Next",
  page: (page: number) => `Page ${page}`,
};
it("composes a quiet native Card with attributes, refs and application actions", async () => {
  const refs = [
    createRef<HTMLDivElement>(),
    createRef<HTMLDivElement>(),
    createRef<HTMLHeadingElement>(),
    createRef<HTMLParagraphElement>(),
    createRef<HTMLDivElement>(),
    createRef<HTMLDivElement>(),
  ];
  const action = vi.fn();
  render(
    <Card
      ref={refs[0] as React.Ref<HTMLDivElement>}
      id="card"
      data-record="DOC-4"
      style={{ maxWidth: 480 }}
    >
      <CardHeader ref={refs[1] as React.Ref<HTMLDivElement>}>
        <CardTitle ref={refs[2] as React.Ref<HTMLHeadingElement>}>
          Document
        </CardTitle>
        <CardDescription ref={refs[3] as React.Ref<HTMLParagraphElement>}>
          Ready to read
        </CardDescription>
        <System.Button onClick={action}>Read</System.Button>
      </CardHeader>
      <CardContent ref={refs[4] as React.Ref<HTMLDivElement>}>
        <bdi dir="ltr">DOC-4</bdi>
      </CardContent>
      <CardFooter ref={refs[5] as React.Ref<HTMLDivElement>}>
        Updated today
      </CardFooter>
    </Card>,
  );
  expect(document.getElementById("card")).toHaveAttribute(
    "data-record",
    "DOC-4",
  );
  expect(refs.map((ref) => ref.current?.tagName)).toEqual([
    "DIV",
    "DIV",
    "H3",
    "P",
    "DIV",
    "DIV",
  ]);
  expect(document.getElementById("card")).not.toHaveAttribute("tabindex");
  await userEvent.setup().click(screen.getByRole("button", { name: "Read" }));
  expect(action).toHaveBeenCalledOnce();
});
it("opens one Accordion item, collapses optionally and associates heading/buttons/panels", async () => {
  const user = userEvent.setup(),
    change = vi.fn();
  render(
    <Accordion
      items={items}
      defaultValue="guide"
      collapsible
      onValueChange={change}
      headingLevel={2}
    />,
  );
  const guide = screen.getByRole("button", { name: "Guide" });
  expect(
    screen.getByRole("heading", { level: 2, name: "Guide" }),
  ).toContainElement(guide);
  expect(screen.getByRole("region", { name: "Guide" })).toHaveAttribute(
    "id",
    guide.getAttribute("aria-controls"),
  );
  expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Delivery" }));
  expect(guide).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("region", { name: "Delivery" })).toHaveTextContent(
    "Delivery details",
  );
  await user.click(screen.getByRole("button", { name: "Delivery" }));
  expect(change.mock.calls.map((call) => call[0])).toEqual(["delivery", ""]);
  expect(screen.queryByRole("region")).toBeNull();
});
it("keeps noncollapsible Accordion open and delegates arrows/Home/End/Space to the primitive", async () => {
  const user = userEvent.setup();
  render(<Accordion items={items} defaultValue="guide" />);
  const guide = screen.getByRole("button", { name: "Guide" }),
    delivery = screen.getByRole("button", { name: "Delivery" });
  await user.click(guide);
  expect(guide).toHaveAttribute("aria-expanded", "true");
  guide.focus();
  await user.keyboard("{ArrowDown}");
  expect(delivery).toHaveFocus();
  await user.keyboard("{Home}");
  expect(guide).toHaveFocus();
  await user.keyboard("{End}");
  expect(delivery).toHaveFocus();
  await user.keyboard(" ");
  expect(delivery).toHaveAttribute("aria-expanded", "true");
  await user.keyboard("{ArrowUp}");
  expect(guide).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(guide).toHaveAttribute("aria-expanded", "true");
});
it("honors controlled Accordion state and preserves selection by stable value on reorder", async () => {
  const user = userEvent.setup(),
    change = vi.fn();
  const { rerender } = render(
    <Accordion items={items} value="guide" onValueChange={change} />,
  );
  await user.click(screen.getByRole("button", { name: "Delivery" }));
  expect(change).toHaveBeenCalledWith("delivery");
  expect(screen.getByRole("button", { name: "Guide" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  rerender(
    <Accordion
      items={[...items].reverse()}
      value="delivery"
      onValueChange={change}
    />,
  );
  expect(screen.getByRole("region", { name: "Delivery" })).toHaveTextContent(
    "Delivery details",
  );
});
it("lets an application update controlled Accordion and retain uncontrolled initial value", async () => {
  function Controlled() {
    const [value, setValue] = useState("guide");
    return (
      <Accordion
        items={items}
        value={value}
        onValueChange={setValue}
        collapsible
      />
    );
  }
  const user = userEvent.setup();
  const { unmount } = render(<Controlled />);
  await user.click(screen.getByRole("button", { name: "Delivery" }));
  expect(screen.getByRole("region", { name: "Delivery" })).toBeVisible();
  unmount();
  const { rerender } = render(<Accordion items={items} defaultValue="guide" />);
  await user.click(screen.getByRole("button", { name: "Delivery" }));
  rerender(<Accordion items={[...items].reverse()} defaultValue="guide" />);
  expect(screen.getByRole("button", { name: "Delivery" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});
it("renders Breadcrumbs with native destinations, final current text and decorative separators", () => {
  const ref = createRef<HTMLElement>();
  render(
    <Breadcrumbs
      ref={ref}
      label="مسار الصفحة"
      id="trail"
      items={[
        { label: "الرئيسية", href: "/" },
        { label: <bdi dir="ltr">DOC-4</bdi>, href: "/docs/4" },
        { label: "الدليل", href: "/docs/4/guide" },
      ]}
    />,
  );
  const nav = screen.getByRole("navigation", { name: "مسار الصفحة" });
  expect(ref.current).toBe(nav);
  expect(
    within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href")),
  ).toEqual(["/", "/docs/4"]);
  expect(within(nav).getByText("الدليل")).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(within(nav).getByText("الدليل").tagName).toBe("SPAN");
  expect(nav.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
});
it.each([
  [0, 0, "Page 1", true, true],
  [-10, 9, "Page 1", true, false],
  [2.8, 4.9, "Page 2", false, false],
  [99, 4, "Page 4", false, true],
  [NaN, Infinity, "Page 1", true, true],
  [Infinity, 5, "Page 1", true, false],
])(
  "normalizes page %s and total %s consistently without calling back",
  (page, totalPages, current, previousDisabled, nextDisabled) => {
    const change = vi.fn();
    render(
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={change}
        labels={labels}
        locale="en"
      />,
    );
    expect(screen.getByRole("button", { name: current })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: "Previous" }).hasAttribute("disabled"),
    ).toBe(previousDisabled);
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(nextDisabled);
    expect(change).not.toHaveBeenCalled();
  },
);
it.each([
  [1, ["1", "2", "3", "4", "5", "…", "20"]],
  [10, ["1", "…", "9", "10", "11", "…", "20"]],
  [20, ["1", "…", "16", "17", "18", "19", "20"]],
])(
  "shows a compact range for page %s with noninteractive ellipses",
  (page, slots) => {
    render(
      <Pagination
        page={page}
        totalPages={20}
        labels={labels}
        onPageChange={() => {}}
        locale="en"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Result pages" });
    expect(
      Array.from(nav.querySelectorAll("li")).map((item) => item.textContent),
    ).toEqual(["Previous", ...slots, "Next"]);
    expect(nav.querySelectorAll("button")).toHaveLength(
      slots.filter((slot) => slot !== "…").length + 2,
    );
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  },
);
it("Pagination requests valid pages, keeps control with the caller and forwards nav/ref", async () => {
  const user = userEvent.setup(),
    change = vi.fn(),
    ref = createRef<HTMLElement>();
  const { rerender } = render(
    <Pagination
      ref={ref}
      id="paging"
      page={8}
      totalPages={12}
      labels={labels}
      onPageChange={change}
      locale="en"
    />,
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Page 12" }));
  await user.click(screen.getByRole("button", { name: "Page 8" }));
  expect(change.mock.calls.map((call) => call[0])).toEqual([9, 7, 12]);
  expect(ref.current).toBe(document.getElementById("paging"));
  expect(screen.getByRole("button", { name: "Page 8" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  rerender(
    <Pagination
      page={8}
      totalPages={3}
      labels={labels}
      onPageChange={change}
      locale="en"
      disabled
    />,
  );
  expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen
      .getAllByRole("button")
      .every((button) => button.hasAttribute("disabled")),
  ).toBe(true);
});
it("uses explicit translated labels and Arabic digits independently of direction", () => {
  render(
    <System.SystemProvider
      config={{ ...System.defaultConfig, direction: "ltr" }}
    >
      <Pagination
        page={2}
        totalPages={3}
        onPageChange={() => {}}
        locale="ar"
        labels={{
          navigation: "صفحات النتائج",
          previous: "السابق",
          next: "التالي",
          page: (page) => `الصفحة ${page}`,
        }}
      />
    </System.SystemProvider>,
  );
  expect(screen.getByRole("button", { name: "الصفحة 2" })).toHaveTextContent(
    "٢",
  );
  expect(
    screen.getByRole("navigation", { name: "صفحات النتائج" }),
  ).toBeVisible();
});

it("bounds huge totals without allocating all pages and uses normalized callback targets", async () => {
  const user = userEvent.setup(),
    change = vi.fn();
  render(
    <Pagination
      page={Number.MAX_VALUE}
      totalPages={Number.MAX_VALUE}
      onPageChange={change}
      labels={labels}
      locale="en"
    />,
  );
  expect(
    screen.getByRole("button", { name: "Page 9007199254740991" }),
  ).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("button")).toHaveLength(8);
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(change).toHaveBeenCalledWith(9007199254740990);
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});
it.each([
  [4, 8, ["1", "2", "3", "4", "5", "…", "8"]],
  [5, 8, ["1", "…", "4", "5", "6", "7", "8"]],
  [4, 7, ["1", "2", "3", "4", "5", "6", "7"]],
])(
  "keeps valid unique slots at range transition page %s of %s",
  (page, totalPages, slots) => {
    render(
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={() => {}}
        labels={labels}
        locale="en"
      />,
    );
    expect(
      Array.from(document.querySelectorAll(".tz-pagination li")).map(
        (item) => item.textContent,
      ),
    ).toEqual(["Previous", ...slots, "Next"]);
  },
);
it("starts Accordion closed without inventing a selected value", async () => {
  const user = userEvent.setup();
  render(<Accordion items={items} />);
  expect(screen.queryByRole("region")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Guide" }));
  expect(screen.getByRole("region", { name: "Guide" })).toBeVisible();
});

it.each([false, true])(
  "removes closed Accordion panels from focus and accessibility immediately (controlled=%s)",
  async (controlled) => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Accordion
        items={items}
        defaultValue={controlled ? undefined : "guide"}
        value={controlled ? "guide" : undefined}
        collapsible
      />,
    );
    const guide = screen.getByRole("button", { name: "Guide" });
    const panel = document.getElementById(
      guide.getAttribute("aria-controls")!,
    )!;
    expect(panel).not.toHaveAttribute("inert");
    if (controlled)
      rerender(<Accordion items={items} value="delivery" collapsible />);
    else await user.click(screen.getByRole("button", { name: "Delivery" }));
    expect(panel).toHaveAttribute("inert");
    expect(panel).toHaveAttribute("aria-hidden", "true");
  },
);
