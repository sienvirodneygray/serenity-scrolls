import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "AI Servant | Serenity Scrolls Scripture Companion",
  description: "Use your Serenity Scrolls AI Servant for Scripture-based reflection.",
  path: "/servant",
  noindex: true,
});

export default function ServantLayout({ children }: { children: ReactNode }) {
  return children;
}
