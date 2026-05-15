import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Checkout | Serenity Scrolls",
  description: "Complete your Serenity Scrolls purchase securely.",
  path: "/checkout",
  noindex: true,
});

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<h1 className="min-h-screen flex items-center justify-center text-3xl font-bold">Checkout</h1>}>
      {children}
    </Suspense>
  );
}
