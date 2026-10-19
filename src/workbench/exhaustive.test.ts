import { expect, it } from "vitest";
import { defaultConfig } from "../system";
import { navigationCatalog } from "./catalog";
import { assertNever } from "./exhaustive";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
it("emits Toast playground code only for the Toast page", () => {
  const defaults = defaultPlaygrounds("ar");
  for (const item of navigationCatalog) {
    const code = generateCode(item.id, defaults[item.id], defaultConfig, "ar");
    expect(code.includes('setEvent("toast: '), item.id).toBe(
      item.id === "toast",
    );
  }
});
it("names the context when a component is not handled", () => {
  expect(() => assertNever("nope" as never, "Playground")).toThrow(
    "Playground: unhandled component nope",
  );
});
