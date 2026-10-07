import { describe, expect, it } from "vitest";
import { dueDate, overdueDays } from "../due";

const iso = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;

describe("dueDate", () => {
  it("хоног, өдөр, тоо", () => {
    expect(iso(dueDate("2026-10-01", "14 хоног"))).toBe("2026-10-15");
    expect(iso(dueDate("2026-10-01", "30 өдөр"))).toBe("2026-10-31");
    expect(iso(dueDate("2026-10-01", "7"))).toBe("2026-10-08");
  });
  it("сар", () => expect(iso(dueDate("2026-01-31", "1 сар"))).toBe("2026-03-03"));
  it("тодорхой огноо", () => expect(iso(dueDate("2026-10-01", "2026-11-05"))).toBe("2026-11-05"));
  it("ойлгомжгүй бол null", () => {
    expect(dueDate("2026-10-01", "")).toBeNull();
    expect(dueDate("2026-10-01", "шууд")).toBeNull();
    expect(dueDate("", "14 хоног")).toBeNull();
  });
});

describe("overdueDays", () => {
  const today = new Date("2026-10-20T12:00:00Z");
  const base = { doc_type: "invoice", status: "issued", doc_date: "2026-10-01", pay_due: "14 хоног" };
  it("хэтэрсэн хоногийг тоолно", () => expect(overdueDays(base, today)).toBe(5));
  it("төлөгдсөн, үнийн санал, хугацаандаа бол 0", () => {
    expect(overdueDays({ ...base, status: "paid" }, today)).toBe(0);
    expect(overdueDays({ ...base, doc_type: "quote" }, today)).toBe(0);
    expect(overdueDays({ ...base, pay_due: "30 хоног" }, today)).toBe(0);
  });
});
