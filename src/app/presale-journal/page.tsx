"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PresaleJournalRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reflection-journal");
  }, [router]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse text-lg">Redirecting you to the Reflection Journal page...</p>
    </div>
  );
}
