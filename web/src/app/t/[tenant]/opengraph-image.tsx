import { brandPoster, getTenantBrand } from "@/lib/tenant-brand";

export const alt = "Компанийн хуудас";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ tenant: string }> }) {
  return brandPoster(await getTenantBrand((await params).tenant));
}
