import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Contact Serenity Scrolls | Support, Orders & Product Questions",
  description:
    "Contact Serenity Scrolls for order support, product questions, wholesale inquiries, AI Servant access, journal pre-orders, and customer service.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      {children}
    </>
  );
}
