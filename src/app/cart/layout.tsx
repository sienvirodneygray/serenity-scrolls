import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Your Cart | Serenity Scrolls Checkout",
  description: "Review your Serenity Scrolls items before checkout.",
  path: "/cart",
  noindex: true,
});

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
