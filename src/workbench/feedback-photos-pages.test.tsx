import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
it("documents four feedback pages with complete copied code and prompts", async () => {
  render(<Workbench />);
  const user = userEvent.setup(),
    write = vi.spyOn(navigator.clipboard, "writeText"),
    nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  for (const name of [
    "الرسالة الدلالية",
    "هيكل التحميل",
    "التقدم",
    "مؤشر التحميل",
  ]) {
    await user.click(nav.getByRole("button", { name }));
    expect(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    ).not.toBeEmptyDOMElement();
    expect(screen.queryByRole("status", { name: "آخر حدث" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "نسخ الكود" }));
    const code = write.mock.calls.at(-1)![0];
    await user.click(screen.getByRole("button", { name: "نسخ الطلب" }));
    expect(write.mock.calls.at(-1)![0]).toContain(code);
    expect(code).toContain("SystemProvider");
    expect(code).not.toContain("setTimeout");
  }
});
it("exposes existing src with a minimal photo choice and accurate imports", async () => {
  localStorage.setItem(
    "tiraz.documentation.v2",
    JSON.stringify({
      language: "en",
      active: "avatar",
      systemPanelOpen: true,
      inspectorOpen: true,
    }),
  );
  render(<Workbench />);
  const user = userEvent.setup(),
    write = vi.spyOn(navigator.clipboard, "writeText"),
    preview = within(
      screen.getByRole("region", { name: "Interactive playground" }),
    );
  expect(screen.queryByLabelText("Image URL · optional")).toBeNull();
  await user.selectOptions(screen.getByLabelText("Appearance"), "photo");
  expect(
    preview.getByRole("img", { name: "Sara Ali" }).querySelector("img"),
  ).not.toBeNull();
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  expect(write.mock.calls.at(-1)![0]).toContain("./system/ai/assets/sara.jpg");
  await user.type(
    screen.getByLabelText("Image URL · optional"),
    "/personal.jpg",
  );
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  expect(write.mock.calls.at(-1)![0]).toContain('src={"/personal.jpg"}');
  await user.selectOptions(screen.getByLabelText("Appearance"), "initials");
  expect(
    preview.getByRole("img", { name: "Sara Ali" }).querySelector("img"),
  ).toBeNull();
});
