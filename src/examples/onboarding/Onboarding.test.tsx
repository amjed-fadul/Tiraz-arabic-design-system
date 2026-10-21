import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Onboarding } from "./Onboarding";

type User = ReturnType<typeof userEvent.setup>;
afterEach(() => window.history.replaceState(null, "", "/"));

const next = () => screen.getByRole("button", { name: "متابعة" });
const back = () => screen.getByRole("button", { name: "السابق" });
const title = (name: string) => screen.getByRole("heading", { level: 2, name });
const stepper = () =>
  within(screen.getByRole("list", { name: "خطوات التسجيل" }));
const nameField = () => screen.getByRole("textbox", { name: "اسم المنشأة" });
const code = () => screen.getByRole("textbox", { name: "رمز التحقق" });
const documents = () => [
  new File(["a"], "registration.pdf", { type: "application/pdf" }),
  new File(["b"], "vat-certificate.pdf", { type: "application/pdf" }),
];

async function company(user: User, name = "النخيل") {
  await user.type(nameField(), name);
  await user.type(
    screen.getByRole("textbox", { name: "رقم السجل التجاري" }),
    "1010123456",
  );
  await user.click(next());
}
async function mobile(user: User) {
  await user.type(code(), "123456");
  await user.click(next());
}
async function attach(user: User) {
  fireEvent.change(document.querySelector('input[type="file"]')!, {
    target: { files: documents() },
  });
  await user.click(next());
}

it("checks step one, then moves to step two and focuses its heading", async () => {
  const user = userEvent.setup();
  render(<Onboarding />);
  expect(
    screen.getByRole("heading", { level: 1, name: "سجّل منشأتك" }),
  ).toBeInTheDocument();
  expect(screen.getByText("الخطوة ١ من ٤ · نحو ٥ دقائق")).toBeInTheDocument();
  // Nothing is entered: both errors show, and the name takes focus.
  await user.click(next());
  expect(screen.getByText("أدخل اسم المنشأة.")).toBeInTheDocument();
  expect(
    screen.getByText("أدخل رقم السجل التجاري المكوّن من عشرة أرقام."),
  ).toBeInTheDocument();
  expect(nameField()).toHaveFocus();
  expect(nameField()).toHaveAttribute("aria-invalid", "true");
  // The number is read as ten digits whichever keyboard typed them.
  await company(user);
  expect(screen.getByText("الخطوة ٢ من ٤ · نحو ٥ دقائق")).toBeInTheDocument();
  expect(stepper().getAllByRole("listitem")[0]).toHaveAttribute(
    "data-status",
    "completed",
  );
  expect(stepper().getAllByRole("listitem")[0]).toHaveTextContent("المنشأة");
  expect(title("تأكيد الجوال")).toHaveFocus();
});

it("wants six digits for the code, and takes Arabic-Indic ones", async () => {
  const user = userEvent.setup();
  render(<Onboarding />);
  await company(user);
  await user.type(code(), "12345");
  await user.click(next());
  expect(screen.getByText("أدخل الرمز المكوّن من ستة أرقام.")).toBeVisible();
  expect(code()).toHaveFocus();
  await user.clear(code());
  await user.type(code(), "١٢٣٤٥٦");
  await user.click(next());
  expect(title("المستندات")).toHaveFocus();
  expect(stepper().getAllByRole("listitem")[1]).toHaveAttribute(
    "data-status",
    "completed",
  );
});

it("asks about the name once, folds the answer into a receipt and finishes", async () => {
  // Embedded, the last button hands the screen to the docs instead of going there.
  window.history.replaceState(null, "", "/examples/onboarding?embed=1");
  const post = vi.spyOn(window, "postMessage").mockImplementation(() => {});
  try {
    const user = userEvent.setup();
    render(<Onboarding />);
    await company(user);
    await mobile(user);
    // Both documents are required; the browse button takes focus.
    await user.click(next());
    expect(
      screen.getByText(
        "أرفق المستندين: السجل التجاري وشهادة ضريبة القيمة المضافة.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /تصفّح الملفات/ })).toHaveFocus();
    await attach(user);
    expect(title("المراجعة")).toHaveFocus();
    // The review writes what was entered in the page's digits.
    const review = screen.getByText("رقم السجل التجاري", {
      selector: "dt",
    }).parentElement!;
    expect(review).toHaveTextContent("١٠١٠١٢٣٤٥٦");
    expect(review.textContent).not.toMatch(/[0-9]/);
    expect(
      screen.getByText("بداية السنة المالية", { selector: "dt" }).parentElement,
    ).toHaveTextContent("١ يناير");
    expect(screen.getByText("registration.pdf")).toBeVisible();
    expect(screen.getByText("vat-certificate.pdf")).toBeVisible();
    // The registration says «شركة النخيل للتجارة», and the person typed «النخيل».
    expect(
      screen.getByText(
        "يذكر السجل التجاري «شركة النخيل للتجارة»، بينما أدخلت «النخيل».",
      ),
    ).toBeVisible();
    await user.click(next());
    const registered = screen.getByRole("radio", {
      name: "شركة النخيل للتجارة",
    });
    expect(registered).toHaveAttribute("aria-invalid", "true");
    expect(registered).toHaveFocus();
    await user.click(registered);
    await user.click(next());
    expect(next()).toHaveAttribute("aria-busy", "true");
    expect(
      await screen.findByText("إجاباتك", {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(screen.getByText("أي الاسمين هو الصحيح؟")).toBeVisible();
    expect(
      screen.getByText("شركة النخيل للتجارة", { selector: "dd" }),
    ).toBeVisible();
    // Going back and returning keeps the receipt, and editing opens the
    // question again with the choice kept.
    await user.click(back());
    await user.click(next());
    expect(screen.getByText("إجاباتك")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "تعديل الإجابات" }));
    expect(
      screen.getByRole("radio", { name: "شركة النخيل للتجارة" }),
    ).toBeChecked();
    expect(
      screen.getByRole("heading", { level: 3, name: "أي الاسمين هو الصحيح؟" }),
    ).toHaveFocus();
    await user.click(next());
    await screen.findByText("إجاباتك", {}, { timeout: 5000 });
    await user.click(next());
    expect(title("اكتمل التسجيل")).toHaveFocus();
    expect(screen.getByText("اكتملت الخطوات الأربع.")).toBeVisible();
    expect(
      stepper()
        .getAllByRole("listitem")
        .map((item) => item.getAttribute("data-status")),
    ).toEqual(["completed", "completed", "completed", "completed"]);
    expect(
      screen.getByText(/سجّلنا «شركة النخيل للتجارة» وحفظنا مستنداتك/),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "ابدأ إقفال الشهر" }));
    expect(post).toHaveBeenCalledExactlyOnceWith(
      { type: "tiraz:open-screen", slug: "month-end-close" },
      window.location.origin,
    );
  } finally {
    post.mockRestore();
  }
}, 15000);

it("asks nothing when the name matches the documents", async () => {
  const user = userEvent.setup();
  render(<Onboarding />);
  await company(user, "شركة النخيل للتجارة");
  await mobile(user);
  await attach(user);
  expect(
    screen.getByText("تطابق بياناتك ما في مستنداتك، فلا أسئلة تنتظرك."),
  ).toBeVisible();
  expect(screen.queryByRole("radio")).toBeNull();
  await user.click(next());
  expect(title("اكتمل التسجيل")).toHaveFocus();
});

it("skips to the month-end close from every step, in either language", async () => {
  const user = userEvent.setup();
  render(<Onboarding />);
  expect(screen.getByRole("link", { name: "تخطَّ الآن" })).toHaveAttribute(
    "href",
    "/examples/month-end-close",
  );
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByRole("link", { name: "Skip for now" })).toHaveAttribute(
    "href",
    "/examples/month-end-close?lang=en",
  );
  expect(screen.getByText("Step 1 of 4 · about 5 minutes")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  expect(
    within(
      screen.getByRole("list", { name: "Registration steps" }),
    ).getAllByRole("listitem")[0],
  ).toHaveTextContent("Company");
});
