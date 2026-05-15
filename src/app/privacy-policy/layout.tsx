import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Privacy Policy | Serenity Scrolls Customer Data & Privacy",
  description:
    "Read the Serenity Scrolls Privacy Policy to learn how we collect, use, protect, and manage personal information.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy-policy" },
        ])}
      />
      {children}
    </>
  );
}
