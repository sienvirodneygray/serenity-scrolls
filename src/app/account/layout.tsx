import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Account Access | Serenity Scrolls",
  description: "Access your Serenity Scrolls account, cart, and AI Servant tools.",
  path: "/account",
  noindex: true,
});

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
