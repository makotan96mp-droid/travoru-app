import type { MetadataRoute } from "next";
import { SITE_URL, CITY_META } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const cityPages: MetadataRoute.Sitemap = Object.keys(CITY_META).map((id) => ({
    url: `${SITE_URL}/i/${id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...cityPages,
  ];
}
