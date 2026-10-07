import { brandIcon, getTenantBrand } from "@/lib/tenant-brand";

/** Компанийн хуудасны таб дүрс — компанийн лого */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon({ params }: { params: Promise<{ tenant: string }> }) {
  return brandIcon(await getTenantBrand((await params).tenant), 64, 0.06);
}
