import type { MetadataRoute } from "next";
import { rootUrl } from "@/lib/hosts";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: rootUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: rootUrl("/guide"), changeFrequency: "monthly", priority: 0.7 },
  ];
}
