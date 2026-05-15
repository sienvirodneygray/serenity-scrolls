import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Account Access | Serenity Scrolls",
  description: "Sign in to access your Serenity Scrolls account and AI Servant.",
  path: "/auth",
  noindex: true,
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
