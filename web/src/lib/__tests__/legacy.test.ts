import { describe, expect, it } from "vitest";
import { parseLegacyExport } from "../legacy";

describe("parseLegacyExport", () => {
  it("хуучин апп-ын түүхийг шинэ баримт болгоно", () => {
    const { docs, customers } = parseLegacyExport({
      app: "umgm",
      history: [
        {
          inv: "INV-0001",
          state: {
            docType: "НЭХЭМЖЛЭХ", inv: "012", date: "2026-05-01", customer: "ТҮМЭН ХХК",
            rows: [{ name: "Цаас", unit: "хайрцаг", qty: "2", price: "50000" }, { name: "", qty: 0, price: 0 }],
            invDirector: "Б.Болд", payDue: "14 хоног", vatMode: "incl", buyerRD: "123",
          },
        },
        { state: { docType: "АЛБАН БИЧИГ", letterNum: "01/5", letterTo: "Захирал Д.Бат-д", letterSubject: "Хүсэлт", date: "bad" } },
        { state: { docType: "ҮЛ МЭДЭГДЭХ" } },
      ],
      customers: ["ТҮМЭН ХХК", " ТҮМЭН ХХК ", ""],
    });
    expect(docs).toHaveLength(2);
    expect(docs[0]).toMatchObject({ doc_type: "invoice", number: "012", doc_date: "2026-05-01", customer_name: "ТҮМЭН ХХК", total: 100000 });
    expect(docs[0].data).toMatchObject({ director: "Б.Болд", payDue: "14 хоног", vatMode: "incl", custRD: "123" });
    expect(docs[0].data.rows).toHaveLength(1);
    expect(docs[1]).toMatchObject({ doc_type: "letter", number: "01/5", customer_name: "Захирал Д.Бат-д", total: 0 });
    expect(docs[1].data.subject).toBe("Хүсэлт");
    expect(customers).toEqual(["ТҮМЭН ХХК"]);
  });
  it("буруу файлыг татгалзана", () => {
    expect(() => parseLegacyExport({ foo: 1 })).toThrow();
  });
});
