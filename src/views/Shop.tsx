import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PenLine, ShoppingCart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import tubeProduct from "@/assets/tube.jpeg";
import journalProduct from "@/assets/journal.png";
import servantProduct from "@/assets/servant.jpeg";
import logo from "@/assets/logo.png";
import { AMAZON_PRODUCTS } from "@/lib/amazonAttribution";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_alt: string;
  stock_quantity: number;
  is_available: boolean;
  amazon_sku?: string | null;
  availability_label: string;
  fallback_url?: string;
  cta_label?: string;
}

const fallbackProducts: Product[] = [
  {
    id: "",
    name: "Serenity Scrolls Reflection Journal",
    description:
      "A guided Christian reflection journal for prayer, Scripture reflection, gratitude, emotional processing, and going deeper with each Serenity Scrolls verse.",
    price: 39.99,
    image_url: journalProduct.src,
    image_alt: "Christian Reflection Journal for prayer and Scripture",
    stock_quantity: 1,
    is_available: true,
    amazon_sku: AMAZON_PRODUCTS.journal.sku,
    availability_label: "Available",
    fallback_url: "/reflection-journal",
    cta_label: "Order the Journal",
  },
  {
    id: "",
    name: "AI Servant Scripture Companion",
    description:
      "A Scripture-based reflection companion for Bible verse guidance, prayer prompts, and faith-centered encouragement rooted in God's Word.",
    price: 29.99,
    image_url: servantProduct.src,
    image_alt: "AI Servant Scripture companion and physical Serenity Scrolls Tube",
    stock_quantity: 1,
    is_available: true,
    amazon_sku: AMAZON_PRODUCTS.servant.sku,
    availability_label: "Subscription access available",
    fallback_url: "/servant-landing",
    cta_label: "Explore AI Servant",
  },
  {
    id: "",
    name: "Serenity Scrolls Tube",
    description:
      "96 color-coded Bible verse scrolls organized by emotion for anxiety, gratitude, sadness, joy, frustration, and troubled moments.",
    price: 24.99,
    image_url: tubeProduct.src,
    image_alt: "Serenity Scrolls Bible verse scrolls in keepsake tube",
    stock_quantity: 1,
    is_available: true,
    amazon_sku: AMAZON_PRODUCTS.scrolls.sku,
    availability_label: "Available",
    fallback_url: "/",
    cta_label: "Shop Serenity Scrolls",
  },
];

const getFallbackDetails = (product: Partial<Product>) => {
  const skuMatch = fallbackProducts.find((item) => item.amazon_sku === product.amazon_sku);
  if (skuMatch) return skuMatch;

  return fallbackProducts.find((item) =>
    product.name?.toLowerCase().includes(item.name.toLowerCase().replace("serenity scrolls ", ""))
  );
};

const Shop = () => {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setProducts(fallbackProducts);
        return;
      }

      const hydratedProducts = data.map((product: any) => {
        const fallback = getFallbackDetails(product);
        const stock = Number(product.stock_quantity || 0);

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          image_url: product.image_url || fallback?.image_url || tubeProduct.src,
          image_alt: fallback?.image_alt || product.name,
          stock_quantity: stock,
          is_available: product.is_available,
          amazon_sku: product.amazon_sku,
          availability_label: stock > 0 ? `${stock} in stock` : "Out of stock",
          fallback_url: fallback?.fallback_url,
          cta_label: "Add to Cart",
        };
      });

      const hasServant = hydratedProducts.some((product) =>
        product.name.toLowerCase().includes("servant")
      );

      const getProductPriority = (product: Product) => {
        const name = product.name.toLowerCase();
        if (name.includes("journal") || name.includes("reflection")) return 1;
        if (name.includes("servant") || name.includes("companion") || name.includes("ai")) return 2;
        if (name.includes("tube") || name.includes("scrolls")) return 3;
        return 4;
      };

      const baseProducts = hasServant ? hydratedProducts : [...hydratedProducts, fallbackProducts[1]];
      const sortedProducts = baseProducts.sort((a, b) => getProductPriority(a) - getProductPriority(b));

      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts(fallbackProducts);
    } finally {
      setRefreshing(false);
    }
  };

  const addToCart = async (productId: string) => {
    if (!productId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      let anonSessionId: string | null = null;
      if (!session) {
        anonSessionId = typeof window !== 'undefined'
          ? window.localStorage.getItem("session_id")
          : null;
        if (!anonSessionId) {
          anonSessionId = crypto.randomUUID();
          if (typeof window !== 'undefined') {
            window.localStorage.setItem("session_id", anonSessionId);
          }
        }

        // @ts-ignore - accessing internal headers for RLS compatibility
        supabase.rest.headers['x-session-id'] = anonSessionId;
      }

      const matchColumn = session ? "user_id" : "session_id";
      const matchValue = session ? session.user.id : anonSessionId!;

      const { data: existingItem, error: fetchError } = await supabase
        .from("cart_items")
        .select("*")
        .eq("product_id", productId)
        .eq(matchColumn, matchValue)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingItem) {
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 } as any)
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            product_id: productId,
            user_id: session?.user?.id || null,
            session_id: session ? null : anonSessionId,
            quantity: 1,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Added to cart",
        description: "Product added to your cart successfully",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderProductAction = (product: Product) => {
    if (product.id) {
      return (
        <Button
          className="w-full"
          onClick={() => addToCart(product.id)}
          disabled={product.stock_quantity === 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      );
    }

    if (product.fallback_url?.startsWith("/")) {
      return (
        <Button className="w-full" asChild>
          <Link href={product.fallback_url}>{product.cta_label || "Learn More"}</Link>
        </Button>
      );
    }

    return (
      <Button className="w-full" asChild>
        <a href={product.fallback_url} target="_blank" rel="noopener noreferrer">
          {product.cta_label || "Shop Now"}
        </a>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <section className="mb-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">
                Christian devotional tools
              </p>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Shop Serenity Scrolls Christian Scripture Gifts
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Shop Serenity Scrolls faith-based products designed to help you find Scripture for every emotion. Explore Bible verse scrolls, guided reflection tools, and Scripture-centered companions for daily devotion, prayer, encouragement, and meaningful Christian gifts.
              </p>
            </div>
            <Button onClick={() => router.push("/cart")} variant="outline" className="w-full sm:w-auto">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Cart
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="rounded-xl border border-border bg-card p-5">
            <BookOpen className="h-7 w-7 text-primary mb-3" />
            <h2 className="text-xl font-semibold mb-2">Serenity Scrolls Tube</h2>
            <p className="text-sm text-muted-foreground">
              A beautiful keepsake tube with 96 color-coded Bible verse scrolls for anxiety, sadness, troubled seasons, frustration, gratitude, and joy.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <PenLine className="h-7 w-7 text-primary mb-3" />
            <h2 className="text-xl font-semibold mb-2">Reflection Journal</h2>
            <p className="text-sm text-muted-foreground">
              A guided Christian journal for prayer, Scripture reflection, gratitude practice, emotional processing, and deeper quiet time.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Sparkles className="h-7 w-7 text-primary mb-3" />
            <h2 className="text-xl font-semibold mb-2">AI Servant</h2>
            <p className="text-sm text-muted-foreground">
              A Scripture-based reflection companion that offers Bible verse guidance and prompts while pointing you back to God's Word.
            </p>
          </div>
        </section>

        {refreshing && (
          <p className="text-sm text-muted-foreground mb-4" aria-live="polite">
            Checking current product availability...
          </p>
        )}

        <section aria-label="Serenity Scrolls products" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={`${product.name}-${product.id || product.fallback_url}`} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <img
                  src={product.image_url}
                  alt={product.image_alt}
                  width={640}
                  height={480}
                  className="w-full h-64 object-cover bg-muted"
                />
              </CardHeader>
              <CardContent className="p-6 flex-1">
                <CardTitle className="mb-2">{product.name}</CardTitle>
                <CardDescription className="leading-relaxed">{product.description}</CardDescription>
                <p className="text-2xl font-bold mt-4">${product.price.toFixed(2)}</p>
                <p className={`text-sm mt-1 ${product.stock_quantity > 0 ? "text-muted-foreground" : "text-destructive"}`}>
                  {product.availability_label}
                </p>
              </CardContent>
              <CardFooter>
                {renderProductAction(product)}
              </CardFooter>
            </Card>
          ))}
        </section>

        <section className="mt-16 pt-10 border-t border-border">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-4">Scripture Gifts for Real Emotional Moments</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Serenity Scrolls products are made for the ordinary moments when your heart needs a clear place to begin: the anxious morning, the heavy evening, the grateful celebration, the difficult conversation, or the quiet devotional time before the day starts.
                </p>
                <p>
                  The scrolls make Scripture easy to reach by organizing verses around emotion. The <Link href="/reflection-journal" className="text-primary font-medium hover:underline">Christian Reflection Journal</Link> helps you slow down and respond in prayer. The <Link href="/servant-landing" className="text-primary font-medium hover:underline">AI Scripture companion</Link> offers reflection prompts and faith-centered encouragement when you want help thinking through what you are feeling.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="rounded-xl bg-muted/40 p-5">
                <h3 className="font-semibold text-foreground mb-2">For daily devotion</h3>
                <p className="text-sm text-muted-foreground">Draw one scroll, read slowly, pray honestly, and write a short reflection.</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-5">
                <h3 className="font-semibold text-foreground mb-2">For meaningful gifting</h3>
                <p className="text-sm text-muted-foreground">Give a Christian devotional gift for birthdays, encouragement, sympathy, Mother's Day, Easter, Christmas, or Bible study groups.</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-5">
                <h3 className="font-semibold text-foreground mb-2">For emotional peace</h3>
                <p className="text-sm text-muted-foreground">Use color-coded categories to find Scripture for anxiety, sadness, frustration, gratitude, joy, and troubled seasons.</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-5">
                <h3 className="font-semibold text-foreground mb-2">For going deeper</h3>
                <p className="text-sm text-muted-foreground">Pair scrolls with prayer journal prompts or Scripture-based AI reflection for a richer quiet-time rhythm.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-primary/15 bg-primary/5 p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-4">Helpful Serenity Scrolls Resources</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm font-medium">
            <Link href="/bible-verse-scrolls-for-anxiety-and-peace" className="rounded-lg bg-background border border-border px-4 py-3 hover:text-primary hover:border-primary/30 transition-colors">
              Bible verse scrolls for anxiety and peace
            </Link>
            <Link href="/reflection-journal" className="rounded-lg bg-background border border-border px-4 py-3 hover:text-primary hover:border-primary/30 transition-colors">
              Christian Reflection Journal
            </Link>
            <Link href="/servant-landing" className="rounded-lg bg-background border border-border px-4 py-3 hover:text-primary hover:border-primary/30 transition-colors">
              AI Scripture companion
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Shop;
