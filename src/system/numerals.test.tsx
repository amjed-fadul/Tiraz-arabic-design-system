import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  ApprovalFlow,
  AskUserQuestions,
  AvatarGroup,
  BarChart,
  ContextMeter,
  DatePicker,
  FileDropzone,
  InlineCitation,
  InsightCards,
  LoadingState,
  NotificationList,
  Pagination,
  Progress,
  SidebarContent,
  SidebarItem,
  Sources,
  Steps,
  SystemProvider,
  TagInput,
  TaskRows,
  ToastProvider,
  ToolChips,
  defaultConfig,
  numberLocale,
} from "./index";
import type { Numerals, SystemConfig } from "./config";
import { chartCategory, chartNumber } from "./chart-format";
import { AvatarExamples } from "./ai/examples/AvatarExamples";
import { ChatAppExample } from "./ai/examples/ChatAppExample";
import { CustomerDataTable } from "./ai/examples/CustomerDataTable";
import { TeamExample } from "./ai/examples/OverlayExamples";

// Digits only from the expected system, at least one present.
const digits: Record<Numerals, RegExp> = {
  arab: /^[^0-9]*[٠-٩][^0-9]*$/,
  latn: /^[^٠-٩]*[0-9][^٠-٩]*$/,
};
const settings = ["arab", "latn"] as const;

function wrap(children: ReactNode, config: Partial<SystemConfig> = {}) {
  return render(
    <SystemProvider config={{ ...defaultConfig, ...config }}>
      {children}
    </SystemProvider>,
  );
}

describe("numberLocale", () => {
  it("keeps Arabic-Indic digits by default and switches Arabic to Western", () => {
    expect(defaultConfig.numerals).toBe("arab");
    expect(numberLocale(defaultConfig)).toBe("ar-u-nu-arab");
    expect(numberLocale({ direction: "rtl" })).toBe("ar-u-nu-arab");
    expect(numberLocale({ ...defaultConfig, numerals: "latn" })).toBe(
      "ar-u-nu-latn",
    );
  });
  it("derives language from direction and passes other languages through", () => {
    expect(numberLocale({ direction: "ltr", numerals: "arab" })).toBe("en");
    expect(numberLocale({ direction: "ltr", numerals: "latn" }, "ar")).toBe(
      "ar-u-nu-latn",
    );
    expect(numberLocale({ direction: "rtl", numerals: "latn" }, "en")).toBe(
      "en",
    );
    expect(numberLocale({ numerals: "arab" }, "fr")).toBe("fr");
  });
});

it.each(settings)("SystemProvider exposes numerals=%s", (numerals) => {
  const view = wrap(<span />, { numerals });
  expect(view.container.querySelector(".tiraz-system")).toHaveAttribute(
    "data-numerals",
    numerals,
  );
});

describe.each(settings)("numerals=%s", (numerals) => {
  it("Progress formats its visible and accessible percentage", () => {
    wrap(<Progress label="التقدم" value={42} showValue />, { numerals });
    const bar = screen.getByRole("progressbar", { name: "التقدم" });
    expect(bar.getAttribute("aria-valuetext")).toMatch(digits[numerals]);
    expect(bar.getAttribute("aria-valuetext")).toContain(
      numerals === "arab" ? "٤٢" : "42",
    );
    // An explicit Arabic locale under LTR still follows the setting.
    wrap(<Progress label="Upload" value={7} locale="ar" />, {
      direction: "ltr",
      numerals,
    });
    expect(
      screen
        .getByRole("progressbar", { name: "Upload" })
        .getAttribute("aria-valuetext"),
    ).toMatch(digits[numerals]);
  });

  it("Pagination formats page numbers", () => {
    wrap(
      <Pagination
        page={12}
        totalPages={30}
        onPageChange={() => {}}
        labels={{
          navigation: "صفحات النتائج",
          previous: "السابق",
          next: "التالي",
          page: (page) => `الصفحة ${page}`,
        }}
      />,
      { numerals },
    );
    expect(screen.getByRole("button", { name: "الصفحة 12" })).toHaveTextContent(
      numerals === "arab" ? "١٢" : "12",
    );
    expect(screen.getByRole("button", { name: "الصفحة 30" })).toHaveTextContent(
      numerals === "arab" ? "٣٠" : "30",
    );
  });

  it("DatePicker formats the trigger, day names, day cells and year choices", async () => {
    const user = userEvent.setup();
    wrap(<DatePicker label="الموعد" defaultValue="2028-02-29" />, {
      numerals,
    });
    const trigger = screen.getByRole("button", { name: /الموعد/ });
    expect(trigger).toHaveTextContent(
      numerals === "arab" ? "٢٩ فبراير ٢٠٢٨" : "29 فبراير 2028",
    );
    await user.click(trigger);
    const day = screen.getByRole("button", {
      name: numerals === "arab" ? /٢٩ فبراير ٢٠٢٨/ : /29 فبراير 2028/,
    });
    expect(day.textContent).toMatch(digits[numerals]);
    expect(day).toHaveTextContent(numerals === "arab" ? "٢٩" : "29");
    // The year trigger shows the year formatter's label for the shown month.
    expect(document.querySelector(".tz-date-year-trigger")).toHaveTextContent(
      numerals === "arab" ? "٢٠٢٨" : "2028",
    );
  });

  it("chart formatters format Arabic numbers and dates and leave English alone", () => {
    expect(chartNumber(1234.5, "ar", undefined, numerals)).toBe(
      new Intl.NumberFormat(`ar-u-nu-${numerals}`).format(1234.5),
    );
    expect(chartNumber(1234.5, "ar", undefined, numerals)).toMatch(
      digits[numerals],
    );
    expect(chartNumber(1200, "ar", { notation: "compact" }, numerals)).toMatch(
      digits[numerals],
    );
    expect(chartCategory("2026-01-05", "ar", "date", numerals)).toMatch(
      digits[numerals],
    );
    expect(chartNumber(1234.5, "en", undefined, numerals)).toBe("1,234.5");
    expect(chartCategory("2026-01-05", "en", "date", numerals)).toBe("Jan 5");
  });

  it("charts render data table values with the configured digits", async () => {
    wrap(
      <BarChart
        label="الطلبات"
        summary="بيانات تجريبية."
        data={[
          { category: "2026-01-05", web: 1250 },
          { category: "2026-01-06", web: 980 },
        ]}
        series={[{ key: "web", label: "الويب" }]}
        categoryFormat="date"
        dataTable
      />,
      { numerals },
    );
    await userEvent.click(screen.getByText("عرض جدول البيانات"));
    const table = screen.getByRole("table");
    const value = new Intl.NumberFormat(`ar-u-nu-${numerals}`).format(1250);
    expect(within(table).getByText(value).textContent).toMatch(
      digits[numerals],
    );
  });

  it("every other formatted count follows the setting", () => {
    const view = wrap(
      <>
        <Steps
          label="الخطوات"
          items={[
            { id: "a", label: "الأولى", status: "current" },
            { id: "b", label: "الثانية", status: "upcoming" },
          ]}
        />
        <ToolChips
          label="الأدوات"
          items={[{ id: "s", label: "بحث", state: "completed", count: 12 }]}
        />
        <NotificationList
          label="التنبيهات"
          items={[{ id: "n", title: "تحديث", timestamp: "اليوم", read: false }]}
        />
        <TaskRows
          label="المهام"
          items={[{ id: "t", title: "مراجعة", state: "pending", content: "" }]}
        />
        <LoadingState label="جارٍ التحميل" elapsedMs={1500} />
        <FileDropzone
          label="الملفات"
          defaultValue={[new File(["x".repeat(2048)], "تقرير.txt")]}
        />
        <ContextMeter used={64} capacity={100} />
      </>,
      { numerals },
    );
    const text = (selector: string) =>
      view.container.querySelector(selector)?.textContent ?? "";
    for (const selector of [
      ".tz-step-indicator",
      ".tz-tool-count",
      ".tz-notification-header .tz-badge",
      ".tz-agent-task-indicator",
      ".tz-loading-elapsed",
      ".tz-file-size",
    ])
      expect(text(selector), selector).toMatch(digits[numerals]);
    const meter = screen.getByRole("button", { name: /السياق/ });
    expect(meter).toHaveAccessibleName(digits[numerals]);
    expect(meter).toHaveAccessibleName(numerals === "arab" ? /٦٤٪/ : /64/);
  });

  it('ContextMeter follows the setting when the host passes locale="ar"', () => {
    wrap(<ContextMeter used={64} capacity={100} locale="ar" />, { numerals });
    const meter = screen.getByRole("button", { name: /السياق/ });
    // The full and percent figures are in the name; the compact ones show.
    expect(meter).toHaveAccessibleName(digits[numerals]);
    expect(meter).toHaveAccessibleName(numerals === "arab" ? /٦٤٪/ : /64/);
    expect(meter.textContent).toMatch(digits[numerals]);
    // An explicit Arabic locale under LTR follows the setting too.
    wrap(<ContextMeter used={64} capacity={100} locale="ar" />, {
      direction: "ltr",
      numerals,
    });
    const english = screen.getByRole("button", { name: /Context/ });
    expect(english).toHaveAccessibleName(digits[numerals]);
    expect(english.textContent).toMatch(digits[numerals]);
  });
});

describe.each(settings)(
  "numerals=%s outside Intl-only components",
  (numerals) => {
    const n = (western: string) =>
      numerals === "latn"
        ? western
        : western.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

    it("positions, choice hints, citations, counts and overflow follow the setting", () => {
      const view = wrap(
        <>
          <AskUserQuestions
            questions={[
              {
                id: "tone",
                label: "النبرة",
                choices: [
                  { value: "brief", label: "مختصرة" },
                  { value: "full", label: "مفصلة" },
                ],
              },
              { id: "note", label: "ملاحظة", type: "text" },
            ]}
            value={{}}
            onValueChange={() => {}}
            onSubmit={() => {}}
          />
          <ApprovalFlow
            label="الطلبات"
            requests={["a", "b", "c"].map((id) => ({
              id,
              action: "نقل",
              target: id,
              consequences: [],
              approveLabel: "موافقة",
              rejectLabel: "رفض",
            }))}
            onDecision={() => {}}
          />
          <InsightCards
            items={[
              { id: "a", title: "أولى" },
              { id: "b", title: "ثانية" },
            ]}
          />
          <Sources
            defaultExpanded
            items={[{ id: "s", number: 12, title: "تقرير" }]}
          />
          <InlineCitation
            mode="link"
            source={{
              id: "c",
              number: 7,
              title: "دليل",
              href: "https://a.test",
            }}
          />
          <SidebarContent aria-label="التنقل">
            <SidebarItem href="#inbox" icon={null} label="الوارد" count={24} />
            <SidebarItem href="#tags" icon={null} label="الوسوم" count="99+" />
          </SidebarContent>
          <AvatarGroup
            label="الفريق"
            maxVisible={1}
            overflowLabel={(count) => `${count} آخرون`}
            members={[
              { id: "a", name: "سارة" },
              { id: "b", name: "عمر" },
              { id: "c", name: "لينا" },
            ]}
          />
        </>,
        { numerals },
      );
      expect(view.container).toHaveTextContent(`السؤال ${n("1")} من ${n("2")}`);
      // Labels no longer carry choice numbers; the key hint shows them.
      expect(screen.getByRole("radio", { name: "مفصلة" })).toBeVisible();
      expect(
        view.container.querySelector(".tz-question-hint"),
      ).toHaveTextContent(`اضغط ${n("1")}–${n("2")} للاختيار`);
      expect(view.container).toHaveTextContent(`الطلب ${n("1")} من ${n("3")}`);
      expect(
        view.container.querySelector(".tz-insights-position"),
      ).toHaveTextContent(`${n("1")} / ${n("2")}`);
      expect(view.container).toHaveTextContent("مصدر واحد");
      expect(
        view.container.querySelector(".tz-source-number"),
      ).toHaveTextContent(n("12"));
      expect(
        screen.getByRole("link", { name: `المصدر ${n("7")}: دليل` }),
      ).toHaveTextContent(n("7"));
      const counts = view.container.querySelectorAll(".tz-sidebar-count");
      expect(counts[0]).toHaveTextContent(n("24"));
      expect(counts[0]).toHaveAttribute("title", n("24"));
      // String counts are application copy and stay as supplied.
      expect(counts[1]).toHaveTextContent("99+");
      expect(
        view.container.querySelector(".tz-avatar-overflow bdi"),
      ).toHaveTextContent(`+${n("2")}`);
    });

    it("maximum messages format their limits", async () => {
      const user = userEvent.setup();
      const view = wrap(
        <>
          <TagInput label="الوسوم" defaultValue={["أ"]} maxTags={1} />
          <FileDropzone label="الملفات" multiple maxFiles={1} />
        </>,
        { numerals },
      );
      await user.type(
        screen.getByRole("textbox", { name: "الوسوم" }),
        "ب{Enter}",
      );
      expect(view.container).toHaveTextContent(
        `الحد الأقصى ${n("1")} من الوسوم`,
      );
      fireEvent.change(view.container.querySelector('input[type="file"]')!, {
        target: { files: [new File(["a"], "a.txt"), new File(["b"], "b.txt")] },
      });
      expect(view.container).toHaveTextContent(
        `الحد الأقصى ${n("1")} من الملفات`,
      );
    });

    it("the ApprovalFlow announcement names the next request in the configured digits", async () => {
      const user = userEvent.setup();
      const view = wrap(
        <ApprovalFlow
          label="الطلبات"
          requests={["a", "b", "c"].map((id) => ({
            id,
            action: "نقل",
            target: id,
            consequences: [],
            approveLabel: "موافقة",
            rejectLabel: "رفض",
          }))}
          onDecision={async () => {}}
        />,
        { numerals },
      );
      await user.click(screen.getByRole("button", { name: "موافقة" }));
      // The flow's own hidden live region, not the status line of the card.
      const live = view.container.querySelector(
        ".tz-approval-flow > [role=status]",
      );
      await waitFor(() =>
        expect(live).toHaveTextContent(
          `تمت الموافقة: نقل · a. الطلب ${n("2")} من ${n("3")}`,
        ),
      );
      expect(live?.textContent).toMatch(digits[numerals]);
      // What is announced is what the visible position says.
      expect(
        view.container.querySelector(".tz-decision-position"),
      ).toHaveTextContent(`الطلب ${n("2")} من ${n("3")}`);
    });

    it("the AvatarGroup examples agree the Arabic count with the number of hidden members", () => {
      const view = wrap(
        <>
          <TeamExample language="ar" />
          <AvatarExamples language="ar" />
          <TeamExample language="ar" maxVisible={4} />
        </>,
        { numerals },
      );
      const labels = view.container.querySelectorAll(
        ".tz-avatar-overflow .tz-visually-hidden",
      );
      expect(labels).toHaveLength(3);
      for (const label of Array.from(labels).slice(0, 2))
        expect(label).toHaveTextContent(/^عضوان آخران: /);
      expect(labels[2]).toHaveTextContent(/^عضو آخر: /);
    });

    it("the DataTable example's result count follows the setting", () => {
      wrap(
        <ToastProvider label="تنبيهات العملاء" closeLabel="إغلاق التنبيه">
          <CustomerDataTable language="ar" />
        </ToastProvider>,
        { numerals },
      );
      // DataTable hands resultCount raw numbers, so the host formats them.
      const count = within(
        screen.getByRole("navigation", { name: "صفحات العملاء" }),
      ).getByRole("status");
      expect(count.textContent).toBe(`${n("1")}–${n("10")} من ${n("26")} عميل`);
      expect(count.textContent).toMatch(digits[numerals]);
    });

    it("a new conversation in the ChatApp example is titled in the configured digits", async () => {
      const user = userEvent.setup();
      const view = wrap(<ChatAppExample language="ar" />, { numerals });
      const navigation = screen.getAllByRole("navigation", {
        name: "المحادثات",
      })[0];
      await user.click(
        within(navigation).getByRole("button", { name: "محادثة جديدة" }),
      );
      // The example starts with four conversations, so the new one is the fifth.
      const title = `محادثة ${n("5")}`;
      expect(
        within(navigation).getByRole("button", { name: title }),
      ).toHaveAttribute("aria-current", "true");
      expect(
        view.container.querySelector(".tz-chat-app-title")?.textContent,
      ).toBe(title);
    });

    it("the citation popup shows its number in the configured digits", async () => {
      const user = userEvent.setup();
      wrap(
        <InlineCitation
          source={{ id: "c", number: 7, title: "دليل", href: "https://a.test" }}
        />,
        { numerals },
      );
      await user.click(
        screen.getByRole("button", { name: `المصدر ${n("7")}: دليل` }),
      );
      const popup = screen.getByRole("dialog", { name: "دليل" });
      expect(
        popup.querySelector(".tz-citation-domain > bdi:last-child")
          ?.textContent,
      ).toBe(n("7"));
    });
  },
);

it.each(["2", "٢", "۲"])(
  "AskUserQuestions selects the second choice with the %s key",
  async (key) => {
    const user = userEvent.setup();
    const answers: Record<string, unknown>[] = [];
    wrap(
      <AskUserQuestions
        questions={[
          {
            id: "tone",
            label: "النبرة",
            choices: [
              { value: "brief", label: "مختصرة" },
              { value: "full", label: "مفصلة" },
            ],
          },
        ]}
        value={{}}
        onValueChange={(next) => answers.push(next)}
        onSubmit={() => {}}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "مختصرة" }));
    await user.keyboard(key);
    expect(answers.at(-1)).toEqual({ tone: { choice: "full" } });
  },
);
