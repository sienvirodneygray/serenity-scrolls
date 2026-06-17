import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "AI Scripture Companion Beta Program | Serenity Scrolls AI Servant",
  description:
    "Apply to join the exclusive beta program for the Serenity Scrolls AI Servant. Experience Scripture-based faith guidance, reflection prompts, and tailored emotional encouragement.",
  path: "/beta",
  image: "/servant-product.jpg",
});

export default function BetaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI Scripture Companion Beta", path: "/beta" },
        ])}
      />
      {children}
    </>
  );
}
