import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
it("updates image loading percentage in the inspector without remounting the image or frame", () => {
  render(<Workbench />);
  fireEvent.click(screen.getByRole("button", { name: "نتيجة الصورة" }));
  const frame = document.querySelector(".playground-region .tz-image-result");
  const image = frame?.querySelector("img");
  fireEvent.change(screen.getByRole("spinbutton", { name: "نسبة التقدّم" }), {
    target: { value: "81" },
  });
  expect(document.querySelector(".playground-region .tz-image-result")).toBe(
    frame,
  );
  expect(
    document.querySelector(".playground-region .tz-image-result img"),
  ).toBe(image);
  expect(
    document.querySelector('.playground-region [role="progressbar"]'),
  ).toHaveAttribute("aria-valuenow", "81");
});
