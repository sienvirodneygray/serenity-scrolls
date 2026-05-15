import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "AI Servant Access | Serenity Scrolls Scripture Companion",
  description: "Access your Serenity Scrolls AI Servant account.",
  path: "/servant-access",
  noindex: true,
});

export default function ServantAccessLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<h1 className="min-h-screen flex items-center justify-center text-3xl font-bold">Access Your AI Servant</h1>}>
      {children}
    </Suspense>
  );
}
