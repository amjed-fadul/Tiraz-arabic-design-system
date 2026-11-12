import { expect, it } from "vitest";
import { contrastLevel, contrastRatio } from "./contrast";

it("computes WCAG contrast for hex and rgb colours", () => {
  expect(contrastRatio("#232a26", "#ffffff")).toBeCloseTo(14.7, 1);
  expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
  expect(contrastRatio("#000", "rgb(255, 255, 255)")).toBeCloseTo(21, 5);
  expect(contrastRatio("rgba(0, 0, 0, 0.5)", "#fff")).toBeCloseTo(21, 5);
  expect(contrastRatio("not a colour", "#fff")).toBeNaN();
});

it("names the WCAG level", () => {
  expect(contrastLevel(14.7)).toBe("AAA");
  expect(contrastLevel(7)).toBe("AAA");
  expect(contrastLevel(4.5)).toBe("AA");
  expect(contrastLevel(3)).toBe("AA large");
  expect(contrastLevel(2.99)).toBe("Fails");
});
