import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Terms of Service | Serenity Scrolls Purchases & Subscriptions",
  description:
    "Review the Serenity Scrolls Terms of Service for website use, purchases, subscriptions, digital access, and customer responsibilities.",
  path: "/terms-of-service",
});

export default function TermsOfServiceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms-of-service" },
        ])}
      />
      {children}
    </>
  );
}
