import { describe, expect, it } from "vitest";
import { docTotal, filledRows, formatDocNumber } from "../documents";
import { initials } from "../site";
import { isValidSlug, normalizeSlug } from "../slug";
import { toWordsMn } from "../money";
import { daysLeft, isPro } from "../billing";

describe("баримт", () => {
  it("дугаарын хэлбэр", () => {
    expect(formatDocNumber("quote", 7)).toBe("INV-0007");
    expect(formatDocNumber("invoice", 7)).toBe("007");
  });
  it("нийт дүн хоосон мөрийг тооцохгүй", () => {
    const rows = [{ name: "A", unit: "ш", qty: 2, price: 1500 }, { name: "", unit: "ш", qty: 0, price: 0 }];
    expect(filledRows(rows)).toHaveLength(1);
    expect(docTotal(rows)).toBe(3000);
  });
  it("дүнг үсгээр", () => {
    expect(toWordsMn(1800000)).toContain("сая");
    expect(toWordsMn(1800000)).toContain("төгрөг");
  });
});

describe("бусад", () => {
  it("компанийн нэрийн үсэг", () => {
    expect(initials("Хурд ХХК")).toBe("ХУ");
    expect(initials("Эрдэнэс Төмөр ХХК")).toBe("ЭТ");
  });
  it("дэд домэйн", () => {
    expect(normalizeSlug("  Tumen ")).toBe("tumen");
    expect(isValidSlug("tumen")).toBe(true);
    expect(isValidSlug("-bad")).toBe(false);
  });
  it("багц", () => {
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
    expect(isPro({ plan: "pro", paid_until: future })).toBe(true);
    expect(isPro({ plan: "pro", paid_until: new Date(Date.now() - 1000).toISOString() })).toBe(false);
    expect(daysLeft(future)).toBe(3);
    expect(daysLeft(null)).toBeNull();
  });
});
