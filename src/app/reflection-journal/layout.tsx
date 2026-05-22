import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Christian Reflection Journal | Prayer, Scripture & Emotional Peace",
  description:
    "Order the Serenity Scrolls Reflection Journal for guided prayer, Scripture reflection, gratitude, emotional healing, and daily Christian journaling.",
  path: "/reflection-journal",
  image: "/journal-product.jpg",
});

export default function ReflectionJournalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Christian Reflection Journal", path: "/reflection-journal" },
        ])}
      />
      {children}
    </>
  );
}
