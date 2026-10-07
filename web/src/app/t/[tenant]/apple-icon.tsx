import { brandIcon, getTenantBrand } from "@/lib/tenant-brand";

/** iPhone «Нүүр дэлгэцэнд нэмэх» дүрс — компанийн лого */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon({ params }: { params: Promise<{ tenant: string }> }) {
  return brandIcon(await getTenantBrand((await params).tenant), 180);
}
