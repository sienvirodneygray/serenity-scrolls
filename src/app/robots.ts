import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/auth", "/checkout", "/account", "/cart"],
    },
    sitemap: "https://serenityscrolls.faith/sitemap.xml",
  };
}
