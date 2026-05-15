import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Data Protection Policy | Serenity Scrolls Customer Privacy",
  description:
    "Read the Serenity Scrolls Data Protection Policy to learn how customer data, account information, and privacy rights are handled.",
  path: "/data-protection-policy",
});

export default function DataProtectionPolicyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Data Protection Policy", path: "/data-protection-policy" },
        ])}
      />
      {children}
    </>
  );
}
