/**
 * @vitest-environment node
 */

import { describe, expect, it } from "vitest";

import { appointmentCalendarQuerySchema } from "./appointment.query";

describe("Appointment calendar query", () => {
  it("validates UTC intervals, filters, and trims search", () => {
    const result = appointmentCalendarQuerySchema.safeParse({
      from: "2031-02-05T10:00:00.000Z",
      toExclusive: "2031-02-05T10:30:00.000Z",
      search: "  Ana  ",
      status: "CONFIRMED",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("Ana");
    }
  });

  it("rejects non-increasing, invalid, and overlong intervals", () => {
    expect(
      appointmentCalendarQuerySchema.safeParse({
        from: "2031-02-05T10:30:00.000Z",
        toExclusive: "2031-02-05T10:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      appointmentCalendarQuerySchema.safeParse({
        from: "not-a-date",
        toExclusive: "2031-02-05T10:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      appointmentCalendarQuerySchema.safeParse({
        from: "2031-02-01T00:00:00.000Z",
        toExclusive: "2031-04-05T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
