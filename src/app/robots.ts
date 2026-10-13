import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/play/login",
          "/play/otp",
          "/play/checkout",
          "/play/bookings",
          "/play/favourites",
          "/play/alerts",
          "/play/profile",
          "/play/settings",
          "/play/feedback",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url.replace(/^https?:\/\//, ""),
  };
}
