import { expect, it } from "vitest";
import { defaultConfig } from "../system";
import { navigationCatalog } from "./catalog";
import type { ComponentId } from "./catalog";
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
// A component id is not `never`, so passing one is a type error. `tsc -b`
// checks test files, so loosening `value: never` leaves the directive below
// unused and fails the build. At run time the call still throws.
it("rejects a real component id at build time and at run time", () => {
  expect(() =>
    // @ts-expect-error A ComponentId is not `never`, so this must not compile.
    assertNever("toast" as ComponentId, "test"),
  ).toThrow("test: unhandled component toast");
});
