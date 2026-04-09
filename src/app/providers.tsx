"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import "@/lib/firebase";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnalyticsTracker />
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </TooltipProvider>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
}
