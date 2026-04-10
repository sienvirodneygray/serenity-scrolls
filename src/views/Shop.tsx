import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // For anonymous users, generate/reuse a persistent session ID
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

        // Set the header that RLS policies check via current_setting('request.headers')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24">
          <div className="text-center">Loading products...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Faith-Based Journals & Scripture Tools</h1>
            <p className="text-muted-foreground">
              Discover our guided journals with prompts, Bible verse scrolls, and devotional tools for spiritual growth
            </p>
          </div>
          <Button onClick={() => router.push("/cart")} variant="outline">
            <ShoppingCart className="mr-2 h-4 w-4" />
            View Cart
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products available at the moment.</p>
            <p className="text-sm text-muted-foreground">
              Check back soon for our faith journals, guided journal prompts, and Scripture reflection tools.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader className="p-0">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-64 object-cover"
                  />
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="mb-2">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                  <p className="text-2xl font-bold mt-4">${product.price.toFixed(2)}</p>
                  {product.stock_quantity > 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.stock_quantity} in stock
                    </p>
                  ) : (
                    <p className="text-sm text-destructive mt-1">Out of stock</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock_quantity === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* SEO content section */}
        <section className="mt-16 pt-8 border-t">
          <h2 className="text-2xl font-semibold mb-4">Why Choose Our Faith Journals?</h2>
          <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-2">Guided Journal Prompts</h3>
              <p>
                Our journals feature carefully crafted prompts that help you reflect on Scripture, 
                process emotions, and deepen your faith. Perfect for beginners learning how to journal 
                or experienced journalers seeking new inspiration.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Scripture-Based Reflection</h3>
              <p>
                Each journal entry prompt is rooted in Bible verses, helping you connect your daily 
                experiences with God's Word. Our gratitude journal prompts and devotional exercises 
                support spiritual growth and emotional wellness.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Shop;
