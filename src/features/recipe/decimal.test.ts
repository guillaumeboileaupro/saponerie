import { describe, expect, it } from "vitest";
import { isValidPositiveDecimal } from "./decimal";

describe("isValidPositiveDecimal", () => {
  it.each(["0", "5", "0.5", "123.456", "  5  "])("accepte %s", (value) => {
    expect(isValidPositiveDecimal(value)).toBe(true);
  });

  it.each(["", "-1", "-0.5", "abc", "1,5", "1.", ".5", "1e5", "NaN", "Infinity"])(
    "refuse %s",
    (value) => {
      expect(isValidPositiveDecimal(value)).toBe(false);
    },
  );
});
