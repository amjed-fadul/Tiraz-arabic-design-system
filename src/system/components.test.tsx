import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  Tabs,
  Switch,
  DropdownMenu,
  Sheet,
  ToastProvider,
  useToast,
  SystemProvider,
  defaultConfig,
} from "./index";
import type { ReactNode } from "react";
function wrap(children: ReactNode, direction: "rtl" | "ltr" = "rtl") {
  return render(
    <SystemProvider config={{ ...defaultConfig, direction }}>
      {children}
    </SystemProvider>,
  );
}
describe("public component contracts", () => {
  it("blocks repeat actions during loading and exposes busy state", async () => {
    const onClick = vi.fn();
    wrap(
      <Button state="loading" onClick={onClick}>
        جارٍ الحفظ
      </Button>,
    );
    const button = screen.getByRole("button");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onClick).not.toHaveBeenCalled();
  });
  it.each(["rtl", "ltr"] as const)(
    "moves Tabs selection in visual order in %s and skips disabled tabs",
    async (dir) => {
      wrap(
        <Tabs
          label="الملفات"
          defaultValue="one"
          items={[
            { value: "one", label: "الأول", content: "المحتوى الأول" },
            { value: "off", label: "معطل", disabled: true, content: "لا" },
            { value: "two", label: "الثاني", content: "المحتوى الثاني" },
          ]}
        />,
        dir,
      );
      const first = screen.getByRole("tab", { name: "الأول" });
      first.focus();
      await userEvent.keyboard(dir === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
      await waitFor(() =>
        expect(screen.getByRole("tab", { name: "الثاني" })).toHaveAttribute(
          "aria-selected",
          "true",
        ),
      );
      expect(screen.getByRole("tabpanel")).toHaveTextContent("المحتوى الثاني");
      await userEvent.keyboard("{Home}");
      await waitFor(() => expect(first).toHaveFocus());
    },
  );
  it("labels a controlled Switch and toggles with Space", async () => {
    const onCheckedChange = vi.fn();
    wrap(
      <Switch
        label="إشعارات البريد"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    const control = screen.getByRole("switch", { name: "إشعارات البريد" });
    control.focus();
    await userEvent.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
  it("opens the menu with the keyboard, skips disabled actions and restores trigger focus on Escape", async () => {
    wrap(
      <DropdownMenu
        trigger={<Button>الإجراءات</Button>}
        items={[
          { id: "edit", label: "تعديل" },
          { id: "locked", label: "معطل", disabled: true },
          { id: "copy", label: "نسخ" },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "الإجراءات" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "تعديل" })).toHaveFocus(),
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "نسخ" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
  it("traps Sheet focus, dismisses with Escape and restores trigger focus", async () => {
    wrap(
      <Sheet
        trigger={<Button>فتح التفاصيل</Button>}
        title="تفاصيل العميل"
        description="معلومات الحساب"
        closeLabel="إغلاق"
      >
        <Button>حفظ</Button>
      </Sheet>,
    );
    const trigger = screen.getByRole("button", { name: "فتح التفاصيل" });
    await userEvent.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "تفاصيل العميل" }),
    ).toBeInTheDocument();
    screen.getByRole("button", { name: "حفظ" }).focus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "إغلاق" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("dismisses Sheet through its close control and returns focus", async () => {
    wrap(
      <Sheet
        trigger={<Button>فتح</Button>}
        title="معلومات"
        description="تفاصيل"
        closeLabel="إغلاق"
      >
        محتوى
      </Sheet>,
    );
    const trigger = screen.getByRole("button", { name: "فتح" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("renders feedback supplied by the caller and dismisses the toast", async () => {
    function Demo() {
      const { toast } = useToast();
      return (
        <Button
          onClick={() =>
            toast({
              title: "تم حفظ الفاتورة",
              description: "INV-2048",
              tone: "success",
            })
          }
        >
          تنبيه
        </Button>
      );
    }
    wrap(
      <ToastProvider closeLabel="إغلاق التنبيه" label="التنبيهات">
        <Demo />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "تنبيه" }));
    expect(screen.getAllByText("تم حفظ الفاتورة").length).toBeGreaterThan(0);
    await userEvent.click(
      screen.getByRole("button", { name: "إغلاق التنبيه" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("تم حفظ الفاتورة")).not.toBeInTheDocument(),
    );
  });
});
it("keeps menu context accessible and closes the menu on Tab", async () => {
  wrap(
    <>
      <Button>سياق الصفحة</Button>
      <DropdownMenu
        trigger={<Button>قائمة</Button>}
        items={[{ id: "edit", label: "تعديل" }]}
      />
    </>,
  );
  const trigger = screen.getByRole("button", { name: "قائمة" });
  trigger.focus();
  await userEvent.keyboard("{ArrowDown}");
  await waitFor(() =>
    expect(screen.getByRole("menuitem", { name: "تعديل" })).toHaveFocus(),
  );
  expect(
    screen.getByRole("button", { name: "سياق الصفحة" }),
  ).toBeInTheDocument();
  await userEvent.tab();
  await waitFor(() =>
    expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
  );
  expect(trigger).toHaveFocus();
});
it("starts Tabs on the first enabled item when the first item is disabled", () => {
  wrap(
    <Tabs
      label="السجلات"
      items={[
        { value: "locked", label: "الأرشيف", disabled: true, content: "مغلق" },
        { value: "current", label: "الحالي", content: "سجلات اليوم" },
      ]}
    />,
  );
  expect(screen.getByRole("tab", { name: "الحالي" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByRole("tabpanel")).toHaveTextContent("سجلات اليوم");
});
