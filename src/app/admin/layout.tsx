import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Admin | Serenity Scrolls",
  description: "Administrative area for Serenity Scrolls.",
  path: "/admin",
  noindex: true,
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
