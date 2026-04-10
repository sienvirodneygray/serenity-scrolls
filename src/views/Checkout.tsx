import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Shield,
  Truck,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  CreditCard,
} from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    amazon_sku?: string | null;
  };
}

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSuccess = searchParams?.get("success") === "true";

  useEffect(() => {
    if (isSuccess) return; // Don't fetch cart on success redirect
    fetchCartItems();
    prefillFromSession();
  }, []);

  const prefillFromSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  };

  const getSessionId = () => {
    const sid =
      typeof window !== "undefined"
        ? window.localStorage.getItem("session_id")
        : null;
    if (sid) {
      // @ts-ignore
      supabase.rest.headers["x-session-id"] = sid;
    }
    return sid;
  };

  const fetchCartItems = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const sessionId = getSessionId();

      const query = supabase.from("cart_items").select(`
          id,
          quantity,
          products (
            id,
            name,
            price,
            image_url,
            amazon_sku
          )
        `);

      if (session) {
        query.eq("user_id", session.user.id);
      } else if (sessionId) {
        query.eq("session_id", sessionId);
      } else {
        router.push("/cart");
        return;
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        router.push("/cart");
        return;
      }

      setCartItems(data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !address || !city || !state || !zipCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all shipping fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const sessionId = getSessionId();

      const items = cartItems.map((item) => ({
        product_id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        quantity: item.quantity,
        amazon_sku: item.products.amazon_sku || null,
      }));

      const { data, error } = await supabase.functions.invoke(
        "create-product-checkout",
        {
          body: {
            items,
            email,
            address: {
              firstName,
              lastName,
              line1: address,
              city,
              state,
              zip: zipCode,
              country: "US",
            },
            userId: session?.user?.id || null,
            sessionId: session ? null : sessionId,
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description:
          "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity,
    0
  );

  // ── Success state ──
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Order Confirmed! 🎉</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Thank you for your purchase! Your order is being processed and will
              be fulfilled by Amazon. You'll receive a shipping confirmation
              email soon.
            </p>
            <div className="bg-muted/50 rounded-xl p-5 border border-border/50 text-left space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Package className="h-5 w-5 text-primary shrink-0" />
                <span>
                  Fulfilled by <strong>Amazon FBA</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Truck className="h-5 w-5 text-primary shrink-0" />
                <span>Standard shipping — typically 3-5 business days</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-5 w-5 text-primary shrink-0" />
                <span>
                  Your payment is protected by <strong>Stripe</strong>
                </span>
              </div>
            </div>
            <Button size="lg" onClick={() => router.push("/")} className="mt-4">
              Return to Homepage
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading checkout...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>
          <h1 className="text-3xl md:text-4xl font-bold">Checkout</h1>
        </div>

        {/* Amazon FBA Trust Banner */}
        <div className="mb-8 bg-gradient-to-r from-[#232F3E] to-[#37475A] rounded-xl p-4 md:p-5 flex flex-wrap items-center gap-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Fulfilled by Amazon</p>
              <p className="text-xs text-white/70">
                Fast, reliable shipping via Amazon FBA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 ml-auto text-xs text-white/80">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Free Shipping
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Secure Payment
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              3-5 Day Delivery
            </span>
          </div>
        </div>

        <form onSubmit={handleCheckout}>
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Shipping Form — 3 cols */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Truck className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    This address will be used for Amazon FBA delivery
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Order confirmation will be sent here
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="CA"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="90210"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Method — locked to Standard */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">Standard Shipping</p>
                        <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                          FREE
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Delivered in 3-5 business days via Amazon FBA
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary — 2 cols */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 space-y-6">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-xl">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.products.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-sm">
                          $
                          {(item.products.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Free
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-13 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md group"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Redirecting to payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay ${total.toFixed(2)}
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                      <Shield className="h-3.5 w-3.5" />
                      Secure checkout powered by Stripe
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Signals */}
                <div className="space-y-3">
                  {[
                    {
                      icon: Package,
                      title: "Fulfilled by Amazon",
                      desc: "Shipped from Amazon's fulfillment centers",
                    },
                    {
                      icon: Shield,
                      title: "Purchase Protection",
                      desc: "Payment secured by Stripe encryption",
                    },
                    {
                      icon: Sparkles,
                      title: "Servant Access Included",
                      desc: "30-day AI Servant trial with every order",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-xs">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
