import { describe, expect, it } from "vitest";
import { appUrl, homeFor, isAppHost, rootUrl, safeNext, tenantFromHost, tenantUrl } from "../hosts";

describe("tenantFromHost", () => {
  it("компанийн дэд домэйныг ялгана", () => {
    expect(tenantFromHost("umgm.hhk.mn")).toBe("umgm");
    expect(tenantFromHost("Hurd.HHK.mn:443")).toBe("hurd");
  });
  it("үндсэн, www, app, бусад домэйн бол null", () => {
    expect(tenantFromHost("hhk.mn")).toBeNull();
    expect(tenantFromHost("www.hhk.mn")).toBeNull();
    expect(tenantFromHost("app.hhk.mn")).toBeNull();
    expect(tenantFromHost("a.b.hhk.mn")).toBeNull();
    expect(tenantFromHost("evil.com")).toBeNull();
    expect(tenantFromHost("hhk.mn.evil.com")).toBeNull();
    expect(tenantFromHost(null)).toBeNull();
  });
});

describe("hosts", () => {
  it("app дэд домэйныг таньна", () => {
    expect(isAppHost("app.hhk.mn")).toBe(true);
    expect(isAppHost("hhk.mn")).toBe(false);
  });
  it("нэвтэрсний дараах хаяг", () => {
    expect(homeFor("umgm.hhk.mn")).toBe("/");
    expect(homeFor("hhk.mn")).toBe("https://app.hhk.mn/");
  });
  it("URL угсралт", () => {
    expect(tenantUrl("umgm", "/billing")).toBe("https://umgm.hhk.mn/billing");
    expect(appUrl("/new")).toBe("https://app.hhk.mn/new");
    expect(rootUrl()).toBe("https://hhk.mn/");
  });
});

describe("safeNext — open redirect-ээс сэргийлнэ", () => {
  it("дотоод замыг зөвшөөрнө", () => expect(safeNext("/documents")).toBe("/documents"));
  it("гадаад хаягийг хаана", () => {
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext(undefined, "/x")).toBe("/x");
  });
});
