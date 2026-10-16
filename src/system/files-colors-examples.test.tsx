import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { FileDropzoneExample } from "./ai/examples/FileDropzoneExamples";
import { ColorPickerExample } from "./ai/examples/ColorPickerExamples";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
const wrap = (node: React.ReactNode) => (
  <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
    {node}
  </SystemProvider>
);
it("live multiple changes keep uncontrolled selection and its local report in sync", async () => {
  const view = render(
    wrap(<FileDropzoneExample language="en" mode="uncontrolled" multiple />),
  );
  fireEvent.change(document.querySelector("input[type=file]")!, {
    target: {
      files: [new File(["local"], "local.txt", { type: "text/plain" })],
    },
  });
  view.rerender(
    wrap(
      <FileDropzoneExample
        language="en"
        mode="uncontrolled"
        multiple={false}
      />,
    ),
  );
  expect(screen.getByText("local.txt")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Read local selection" }),
  );
  expect(document.querySelector("output")).toHaveTextContent("local.txt");
  await userEvent.click(screen.getByRole("button", { name: "Reset files" }));
  await waitFor(() =>
    expect(document.querySelector(".tz-selected-files")).toBeNull(),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Read local selection" }),
  );
  expect(document.querySelector("output")).toHaveTextContent("No files");
});
it.each(["controlled", "uncontrolled"] as const)(
  "working color example mode=%s synchronizes sample, submission and reset",
  async (mode) => {
    render(wrap(<ColorPickerExample language="en" mode={mode} />));
    await userEvent.click(screen.getByRole("button", { name: "Blue" }));
    expect(document.querySelector("figcaption")).toHaveTextContent("#355C87");
    await userEvent.click(
      screen.getByRole("button", { name: "Read form value" }),
    );
    expect(document.querySelector("output")).toHaveTextContent("#355C87");
    await userEvent.click(screen.getByRole("button", { name: "Reset color" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveValue("#805475"),
    );
    expect(document.querySelector("figcaption")).toHaveTextContent("#805475");
  },
);

it.each(["ar", "en"] as const)(
  "keeps %s file guidance truthful when selection rules change and preserves custom help",
  async (language) => {
    const view = render(
      wrap(
        <FileDropzoneExample
          language={language}
          multiple={false}
          accept=".csv"
          maxFiles={1}
        />,
      ),
    );
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    const helper = document.getElementById(
      input.getAttribute("aria-describedby")!,
    )!;
    expect(helper).not.toHaveTextContent(/PDF|3 files|٣ ملفات/);
    fireEvent.change(input, {
      target: {
        files: [new File(["sample"], "notes.txt", { type: "text/plain" })],
      },
    });
    expect(document.querySelector(".tz-selected-files")).toBeNull();
    fireEvent.change(input, {
      target: {
        files: [new File(["sample"], "notes.csv", { type: "text/csv" })],
      },
    });
    expect(screen.getByText("notes.csv")).toBeVisible();
    view.rerender(
      wrap(
        <FileDropzoneExample
          language={language}
          multiple
          accept=".csv"
          maxFiles={1}
        />,
      ),
    );
    fireEvent.change(input, {
      target: {
        files: [new File(["sample"], "extra.csv", { type: "text/csv" })],
      },
    });
    // The LTR provider supplies English rejection labels in both language cases.
    expect(screen.getByText("extra.csv: Maximum of 1 file.")).toBeVisible();
    view.rerender(
      wrap(
        <FileDropzoneExample
          language={language}
          helper="Custom application guidance"
        />,
      ),
    );
    expect(screen.getByText("Custom application guidance")).toBeVisible();
  },
);
