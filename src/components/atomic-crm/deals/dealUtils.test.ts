import { commands } from "vitest/browser";

import { computeWeightedTotal, formatISODateString } from "./dealUtils";

describe("formatISODateString", () => {
  let originalTimezone: string;

  beforeEach(() => {
    originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  afterEach(async () => {
    await commands.setTimezone(originalTimezone);
  });

  it("formats a valid ISO date string correctly", () => {
    const isoDate = "2024-06-15";
    const formattedDate = formatISODateString(isoDate);
    expect(formattedDate).toBe("Jun 15, 2024");
  });

  it("should not shift the date regardless of timezone", async () => {
    // Uses CDP (Emulation.setTimezoneOverride) to actually change the browser's
    // timezone at runtime so we can catch regressions where someone replaces the
    // manual date-component parse with new Date(isoString), which would shift
    // dates in negative-offset timezones like America/New_York.
    const isoDate = "2024-06-15";
    await commands.setTimezone("America/New_York");
    expect(formatISODateString(isoDate)).toBe("Jun 15, 2024");

    await commands.setTimezone("Asia/Tokyo");
    expect(formatISODateString(isoDate)).toBe("Jun 15, 2024");

    await commands.setTimezone("UTC");
    expect(formatISODateString(isoDate)).toBe("Jun 15, 2024");

    await commands.setTimezone("Pacific/Auckland");
    expect(formatISODateString(isoDate)).toBe("Jun 15, 2024");
  });

  it("throw for an invalid date string", () => {
    const invalidDate = "invalid-date";
    expect(() => formatISODateString(invalidDate)).toThrow(
      "Invalid date format. Expected YYYY-MM-DD.",
    );
  });

  it("throw for a date string with wrong format", () => {
    const invalidDate = "15-06-2024";
    expect(() => formatISODateString(invalidDate)).toThrow(
      "Invalid date format. Expected YYYY-MM-DD.",
    );
  });
});

describe("computeWeightedTotal", () => {
  it("returns sum(amounts) * probability for a typical mid-stage probability", () => {
    expect(
      computeWeightedTotal(
        [{ amount: 1000 }, { amount: 2000 }, { amount: 5000 }],
        0.5,
      ),
    ).toBe(4000);
  });

  it("returns 0 for any deals when probability is 0 (Lost stage)", () => {
    expect(
      computeWeightedTotal(
        [{ amount: 1000 }, { amount: 2000 }, { amount: 5000 }],
        0,
      ),
    ).toBe(0);
  });

  it("returns sum(amounts) when probability is 1 (Won stage)", () => {
    expect(
      computeWeightedTotal(
        [{ amount: 1000 }, { amount: 2000 }, { amount: 5000 }],
        1,
      ),
    ).toBe(8000);
  });

  it("returns 0 for an empty deals array regardless of probability", () => {
    expect(computeWeightedTotal([], 0.5)).toBe(0);
    expect(computeWeightedTotal([], 1)).toBe(0);
  });

  it("returns amount * probability for a single deal", () => {
    expect(computeWeightedTotal([{ amount: 1234 }], 0.25)).toBe(308.5);
  });
});
