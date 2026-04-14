"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, Sparkles, ShoppingCart } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async (currentUser: any) => {
    let sessionId = typeof window !== 'undefined' ? window.localStorage.getItem('session_id') : null;
    
    if (!currentUser && !sessionId) {
      setCartCount(0);
      return;
    }

    const query = supabase.from("cart_items").select("quantity");
    if (currentUser) {
      query.eq("user_id", currentUser.id);
    } else if (sessionId) {
      query.eq("session_id", sessionId);
    }

    const { data } = await query;
    if (data) {
      const count = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(count);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      fetchCartCount(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchCartCount(session?.user);
    });

    // Also set up an interval to occasionally poll cart if they have an active session ID
    // or just fetch once
    fetchCartCount(user);

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src={logo.src} alt="Serenity Scrolls" className="h-20 w-auto" />
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/contact">
              Contact
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/servant-landing">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Servant
            </Link>
          </Button>
          
          <Button variant="ghost" className="relative px-2" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-primary text-primary-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/servant">
                  Your Servant
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/unlock">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
