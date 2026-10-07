import { brandIcon, getTenantBrand } from "@/lib/tenant-brand";

/** /t/{slug}/app-icon/{192|512|maskable} — компанийн апп-ын manifest дүрс */
export async function GET(_: Request, { params }: { params: Promise<{ tenant: string; size: string }> }) {
  const { tenant, size } = await params;
  const brand = await getTenantBrand(tenant);
  const res =
    size === "maskable" ? await brandIcon(brand, 512, 0.22) : await brandIcon(brand, size === "192" ? 192 : 512);
  res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
  return res;
}
