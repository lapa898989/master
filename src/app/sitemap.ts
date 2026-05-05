import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/auth/login`, lastModified: new Date() },
    { url: `${base}/auth/register`, lastModified: new Date() },
    { url: `${base}/privacy`, lastModified: new Date() },
    { url: `${base}/terms`, lastModified: new Date() }
  ];
}

