import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { TeamSettings } from "./TeamSettings";

type User = ReturnType<typeof userEvent.setup>;

const table = () => screen.getByRole("table", { name: "أعضاء فريق المالية" });
const title = () => screen.getByRole("heading", { level: 2, name: "الفريق" });
const closed = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
const removeButton = (name: string) =>
  screen.getByRole("button", { name: `إزالة ${name}` });

/** Opens «إزالة {name}» and confirms it. */
async function remove(user: User, name: string) {
  await user.click(removeButton(name));
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: `إزالة ${name}`,
    }),
  );
  await closed();
}
async function invite(user: User, address: string) {
  await user.click(screen.getByRole("button", { name: "دعوة عضو" }));
  await user.type(
    screen.getByRole("textbox", { name: "البريد الإلكتروني" }),
    address,
  );
  await user.click(screen.getByRole("button", { name: "أرسل الدعوة" }));
}

it("asks before removing a member, and Escape or Cancel changes nothing", async () => {
  const user = userEvent.setup();
  render(<TeamSettings />);
  expect(screen.getByText("٦ من ١٠ مقاعد")).toBeVisible();
  // Laila is you, and the five others each have a button named with them.
  expect(within(table()).getByText("أنتِ")).toBeVisible();
  expect(screen.queryByRole("button", { name: /^إزالة ليلى/ })).toBeNull();
  expect(screen.getAllByRole("button", { name: /^إزالة / })).toHaveLength(5);
  const sara = removeButton("سارة علي");
  await user.click(sara);
  const dialog = screen.getByRole("dialog", {
    name: "إزالة سارة علي من الفريق؟",
  });
  // The safe action starts with focus.
  expect(within(dialog).getByRole("button", { name: "إلغاء" })).toHaveFocus();
  await user.keyboard("{Escape}");
  await closed();
  expect(sara).toHaveFocus();
  expect(table()).toHaveTextContent("سارة علي");
  await user.click(sara);
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "إلغاء" }),
  );
  await closed();
  expect(sara).toHaveFocus();
  expect(table()).toHaveTextContent("سارة علي");
  expect(screen.getByText("٦ من ١٠ مقاعد")).toBeVisible();
  // Confirming removes the row and frees the seat; the heading takes focus.
  await remove(user, "سارة علي");
  expect(table()).not.toHaveTextContent("سارة علي");
  expect(screen.getByText("٥ من ١٠ مقاعد")).toBeVisible();
  expect(screen.getByText("تمت إزالة سارة علي من الفريق")).toBeVisible();
  expect(title()).toHaveFocus();
});

it("keeps the assistant's irreversible actions at «اسأل دائمًا» and its settings across tabs", async () => {
  const user = userEvent.setup();
  render(<TeamSettings />);
  await user.click(screen.getByRole("tab", { name: "المساعد" }));
  expect(
    screen.getByRole("heading", { level: 2, name: "إعدادات المساعد" }),
  ).toBeVisible();
  for (const action of ["إرسال رسائل للعملاء", "جدولة دفعات الموردين"]) {
    const group = screen.getByRole("group", { name: new RegExp(action) });
    expect(
      within(group).getByRole("radio", { name: "اسأل دائمًا" }),
    ).toBeChecked();
    expect(
      within(group).getByRole("radio", { name: "إن كان حساسًا" }),
    ).toBeDisabled();
    expect(
      within(group).getByRole("radio", { name: "تلقائي بالكامل" }),
    ).toBeDisabled();
  }
  // A reversible action's level is the person's to change, and the screen
  // keeps it while the other tab shows.
  const ledger = () =>
    screen.getByRole("group", { name: /قراءة دفتر الحسابات والفواتير/ });
  expect(
    within(ledger()).getByRole("radio", { name: "تلقائي بالكامل" }),
  ).toBeChecked();
  await user.click(
    within(ledger()).getByRole("radio", { name: "اسأل دائمًا" }),
  );
  await user.click(screen.getByRole("tab", { name: "الفريق" }));
  expect(title()).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "المساعد" }));
  expect(
    within(ledger()).getByRole("radio", { name: "اسأل دائمًا" }),
  ).toBeChecked();
});

it("invites by email, marks the new row and counts its seat, until the seats run out", async () => {
  const user = userEvent.setup();
  render(<TeamSettings />);
  await user.click(screen.getByRole("button", { name: "دعوة عضو" }));
  const email = () =>
    screen.getByRole("textbox", { name: "البريد الإلكتروني" });
  expect(email()).toHaveFocus();
  // Nothing, a malformed address and one already on the team are each refused,
  // with the field focused.
  const send = () => screen.getByRole("button", { name: "أرسل الدعوة" });
  await user.click(send());
  expect(screen.getByText("أدخل البريد الإلكتروني.")).toBeVisible();
  expect(email()).toHaveFocus();
  await user.type(email(), "noura");
  await user.click(send());
  expect(screen.getByText("أدخل بريدًا إلكترونيًا صحيحًا.")).toBeVisible();
  await user.clear(email());
  await user.type(email(), "sara@tiraz.example");
  await user.click(send());
  expect(screen.getByText("هذا البريد في الفريق بالفعل.")).toBeVisible();
  await user.clear(email());
  await user.type(email(), "noura@tiraz.example");
  await user.click(send());
  await closed();
  // The row is marked «مدعو», holds a seat, and focus returns to the button.
  const row = within(table()).getByRole("row", { name: /noura@tiraz.example/ });
  expect(within(row).getByText("مدعو")).toBeVisible();
  expect(within(row).getByText("بانتظار القبول")).toBeVisible();
  expect(screen.getByText("٧ من ١٠ مقاعد")).toBeVisible();
  expect(screen.getByText("أُرسلت الدعوة")).toBeVisible();
  expect(screen.getByRole("button", { name: "دعوة عضو" })).toHaveFocus();
  // The form starts empty again, and a full team refuses one more.
  await invite(user, "a@tiraz.example");
  await closed();
  await invite(user, "b@tiraz.example");
  await closed();
  await invite(user, "c@tiraz.example");
  await closed();
  expect(screen.getByText("١٠ من ١٠ مقاعد")).toBeVisible();
  await invite(user, "d@tiraz.example");
  expect(
    screen.getByText("اكتملت المقاعد. أزل عضوًا لتدعو غيره."),
  ).toBeVisible();
  // Cancelling leaves the team as it was.
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "إلغاء" }),
  );
  await closed();
  expect(table()).not.toHaveTextContent("d@tiraz.example");
  expect(screen.getByText("١٠ من ١٠ مقاعد")).toBeVisible();
});

it("counts members the way Arabic does as they leave, and reads in English", async () => {
  const user = userEvent.setup();
  render(<TeamSettings />);
  expect(screen.getByText("١–٦ من ٦ أعضاء")).toBeVisible();
  await remove(user, "سارة علي");
  await remove(user, "عمر نور");
  await remove(user, "لينا صالح");
  expect(screen.getByText("١–٣ من ٣ أعضاء")).toBeVisible();
  await remove(user, "هدى حسن");
  expect(screen.getByText("١–٢ من عضوين")).toBeVisible();
  await remove(user, "سامي عادل");
  expect(screen.getByText("١–١ من عضو واحد")).toBeVisible();
  expect(screen.getByText("١ من ١٠ مقاعد")).toBeVisible();
  // Only Laila is left, and she can't remove herself.
  expect(screen.queryAllByRole("button", { name: /^إزالة / })).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByText("1 of 10 seats")).toBeVisible();
  expect(screen.getByText("1–1 of 1 member")).toBeVisible();
  expect(screen.getByRole("tab", { name: "Assistant" })).toBeVisible();
});
