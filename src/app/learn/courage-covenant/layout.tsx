import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";

const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Courage Covenant",
  description:
    "A Scripture-based bullying guidance course for Christian parents, students, and faith leaders with eight modules, practical response scripts, and reflection tools.",
  provider: {
    "@type": "Organization",
    name: "Serenity Scrolls",
    url: "https://serenityscrolls.faith",
  },
  url: "https://serenityscrolls.faith/learn/courage-covenant",
};

export const metadata: Metadata = buildSeoMetadata({
  title: "Courage Covenant | Scripture-Based Bullying Guidance Course",
  description:
    "Explore Courage Covenant, a Scripture-based course for Christian parents and leaders who need practical, safety-aware guidance for bullying situations.",
  path: "/learn/courage-covenant",
  image: "/logo.png",
});

export default function CourageCovenantLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Courage Covenant", path: "/learn/courage-covenant" },
        ])}
      />
      <StructuredData data={courseJsonLd} />
      {children}
    </>
  );
}
