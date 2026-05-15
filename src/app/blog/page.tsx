import type { Metadata } from "next";
import Blog from "@/views/Blog";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Serenity Scrolls Blog | Bible Verses, Prayer & Christian Encouragement",
  description:
    "Explore Bible verses, prayer prompts, Christian journaling ideas, and faith-based encouragement for anxiety, gratitude, grief, peace, and daily reflection.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <Blog />
    </>
  );
}
