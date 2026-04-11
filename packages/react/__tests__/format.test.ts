import { describe, it, expect } from "vitest";
import { formatTime, formatPrice, formatDuration } from "../src/format";

describe("formatTime", () => {
  it("converts 24h to 12h format", () => {
    expect(formatTime("14:30")).toBe("2:30 pm");
    expect(formatTime("09:00")).toBe("9:00 am");
    expect(formatTime("00:00")).toBe("12:00 am");
    expect(formatTime("12:00")).toBe("12:00 pm");
    expect(formatTime("23:59")).toBe("11:59 pm");
  });

  it("returns 24h when use24Hour option is set", () => {
    expect(formatTime("14:30", { use24Hour: true })).toBe("14:30");
    expect(formatTime("09:00", { use24Hour: true })).toBe("09:00");
  });
});

describe("formatPrice", () => {
  it("formats USD prices", () => {
    expect(formatPrice(50)).toBe("$50");
    expect(formatPrice(99.99)).toBe("$99.99");
    expect(formatPrice(0)).toBe("$0");
  });

  it("formats with custom currency", () => {
    const result = formatPrice(100, { currency: "EUR", locale: "en-US" });
    expect(result).toContain("100");
  });

  it("handles whole numbers without decimals", () => {
    expect(formatPrice(25)).toBe("$25");
  });
});

describe("formatDuration", () => {
  it("formats minutes only", () => {
    expect(formatDuration(45)).toBe("45 mins");
    expect(formatDuration(15)).toBe("15 mins");
  });

  it("formats hours only", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(135)).toBe("2h 15m");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0 mins");
  });
});
