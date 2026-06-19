import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Courage Covenant™ Course Beta Program | Serenity Scrolls",
  description:
    "Apply to join the exclusive beta program for the Courage Covenant™ course. Experience Scripture-based bullying guidance, reflection prompts, and tailored parent-child tools.",
  path: "/beta-course",
});

export default function BetaCourseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Courage Covenant Beta", path: "/beta-course" },
        ])}
      />
      {children}
    </>
  );
}
