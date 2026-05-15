import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Unlock AI Servant Access | Serenity Scrolls Purchase Verification",
  description:
    "Unlock your Serenity Scrolls AI Servant access using your qualifying purchase details.",
  path: "/unlock",
  noindex: true,
});

export default function UnlockLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<h1 className="min-h-screen flex items-center justify-center text-3xl font-bold">Unlock Your Serenity Scrolls Access</h1>}>
      {children}
    </Suspense>
  );
}
