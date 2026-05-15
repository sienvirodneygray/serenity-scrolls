import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Account Access</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Sign in to manage your Serenity Scrolls access, review your cart, or unlock your AI Servant with qualifying purchase details.
        </p>
        <Card>
          <CardContent className="p-6 grid gap-4 sm:grid-cols-3">
            <Button asChild>
              <Link href="/unlock">Unlock AI Servant</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cart">View Cart</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
