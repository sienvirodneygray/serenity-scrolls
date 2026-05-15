import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "AI Scripture Companion | Serenity Scrolls AI Servant",
  description:
    "Meet the Serenity Scrolls AI Servant, a Scripture-based companion for faith-centered encouragement, reflection prompts, and emotional support rooted in God's Word.",
  path: "/servant-landing",
});

export default function ServantLandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI Scripture Companion", path: "/servant-landing" },
        ])}
      />
      {children}
    </>
  );
}
