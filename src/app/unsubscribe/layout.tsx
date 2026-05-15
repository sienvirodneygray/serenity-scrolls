import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Unsubscribe | Serenity Scrolls",
  description: "Manage Serenity Scrolls email preferences.",
  path: "/unsubscribe",
  noindex: true,
});

export default function UnsubscribeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<h1 className="min-h-screen flex items-center justify-center text-3xl font-bold">Unsubscribe</h1>}>
      {children}
    </Suspense>
  );
}
