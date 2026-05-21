import type { MetadataRoute } from "next";
import { fetchPublishedBlogPosts } from "@/lib/content";

const staticRoutes = [
  "",
  "/shop",
  "/blog",
  "/presale-journal",
  "/servant-landing",
  "/bible-verse-scrolls-for-anxiety-and-peace",
  "/learn/courage-covenant",
  "/learn/courage-challenge",
  "/learn/leader-kit",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/data-protection-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await fetchPublishedBlogPosts();

  return [
    ...staticRoutes.map((route) => ({
      url: `https://serenityscrolls.faith${route || "/"}`,
      lastModified: now,
    })),
    ...posts.map((post) => ({
      url: `https://serenityscrolls.faith/blog/${post.slug}`,
      lastModified: new Date(post.published_at || post.created_at),
    })),
  ];
}
