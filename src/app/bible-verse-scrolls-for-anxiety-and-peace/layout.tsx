import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Bible Verse Scrolls for Anxiety & Peace | Serenity Scrolls",
  description:
    "Discover 96 color-coded Bible verse scrolls organized by emotion. A meaningful Christian gift and daily devotional tool for anxiety, peace, gratitude, sadness, and joy.",
  path: "/bible-verse-scrolls-for-anxiety-and-peace",
  ogTitle: "Bible Verse Scrolls for Anxiety & Peace | Serenity Scrolls",
  ogDescription:
    "Find Scripture for every emotion with 96 color-coded Bible verse scrolls for anxiety, gratitude, sadness, joy, frustration, and troubled moments.",
  image: "/tube-product-real.png",
  twitterCard: "summary_large_image",
});

export default function AnxietyPeaceLandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
