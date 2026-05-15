import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "AI Servant Access Expired | Serenity Scrolls Subscription",
  description: "Renew or manage your Serenity Scrolls AI Servant access.",
  path: "/servant-expired",
  noindex: true,
});

export default function ServantExpiredLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<h1 className="min-h-screen flex items-center justify-center text-3xl font-bold">Your AI Servant Access Has Expired</h1>}>
      {children}
    </Suspense>
  );
}
