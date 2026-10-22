import { readdirSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";

// A hard-coded Arabic digit locale, or a plain "ar" handed to a number or date
// formatter. Current ICU renders plain "ar" with Western digits, and a
// hard-coded "ar-u-nu-arab" ignores SystemConfig.numerals.
const hardCoded =
  /"ar-u-nu-(?:arab|latn)"|(?:NumberFormat|DateTimeFormat|toLocale(?:Date|Time)?String)\(\s*"ar"/;

it("formats Arabic digits only through numberLocale", () => {
  const pattern = new RegExp(hardCoded.source, "g");
  const scanned: string[] = [];
  const offenders: string[] = [];
  for (const entry of readdirSync("src", { recursive: true })) {
    const file = `src/${entry}`;
    if (
      !/\.tsx?$/.test(file) ||
      /\.test\.tsx?$/.test(file) ||
      file === "src/system/config.ts"
    )
      continue;
    scanned.push(file);
    const text = readFileSync(file, "utf8");
    // Scan the whole file so a call split across lines is still found.
    for (const match of text.matchAll(pattern))
      offenders.push(
        `${file}:${text.slice(0, match.index).split("\n").length}`,
      );
  }
  // A walk that finds nothing, or only the top level, would pass vacuously.
  for (const directory of [
    "src/system/",
    "src/system/ai/examples/",
    "src/examples/",
    "src/workbench/",
  ])
    expect(
      scanned.some((file) => file.startsWith(directory)),
      `the guard scanned no files under ${directory}`,
    ).toBe(true);
  expect(
    offenders,
    `Format Arabic numbers and dates with numberLocale(config, language):\n${offenders.join("\n")}`,
  ).toEqual([]);
});
