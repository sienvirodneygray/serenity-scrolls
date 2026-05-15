import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StructuredData } from "@/components/StructuredData";
import {
  breadcrumbJsonLd,
  buildSeoMetadata,
  serenityProductsJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Shop Serenity Scrolls | Christian Scripture Gifts & Devotional Tools",
  description:
    "Shop Serenity Scrolls, Reflection Journals, and faith-based Scripture tools designed for daily encouragement, prayer, emotional peace, and Christian gifting.",
  path: "/shop",
  image: "/tube-product-real.png",
});

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
        ])}
      />
      {serenityProductsJsonLd.map((product) => (
        <StructuredData key={product.name} data={product} />
      ))}
      {children}
    </>
  );
}
