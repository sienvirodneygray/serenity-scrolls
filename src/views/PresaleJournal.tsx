import React, { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Sparkles, BookOpen, Heart } from "lucide-react";
import journalProduct from "@/assets/journal-product.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const PresaleJournal: React.FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [journalId, setJournalId] = useState<string | null>(null);

  useEffect(() => {
    const loadProductId = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, amazon_sku')
        .eq('amazon_sku', '78-SH1V-JG7I')
        .maybeSingle();
      if (data) {
        setJournalId(data.id);
      }
    };
    loadProductId();
  }, []);

  const addToCart = async () => {
    if (!journalId) {
      toast({ title: 'Product not found', description: 'This product is not yet available for direct checkout.', variant: 'destructive' });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();

      let anonSessionId: string | null = null;
      if (!session) {
        anonSessionId = typeof window !== 'undefined' ? window.localStorage.getItem('session_id') : null;
        if (!anonSessionId) {
          anonSessionId = crypto.randomUUID();
          if (typeof window !== 'undefined') window.localStorage.setItem('session_id', anonSessionId);
        }
        // @ts-ignore
        supabase.rest.headers['x-session-id'] = anonSessionId;
      }

      const matchColumn = session ? 'user_id' : 'session_id';
      const matchValue = session ? session.user.id : anonSessionId!;

      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', journalId)
        .eq(matchColumn, matchValue)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 } as any)
          .eq('id', existingItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            product_id: journalId,
            user_id: session?.user?.id || null,
            session_id: session ? null : anonSessionId,
            quantity: 1,
          });
        if (insertError) throw insertError;
      }

      toast({
        title: 'Added to cart',
        description: 'Product added to your cart successfully',
      });
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product to cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-24 md:py-32 flex items-center justify-center">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Product Image */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-2">
              <img 
                src={journalProduct.src} 
                alt="Serenity Scrolls Reflection Journal" 
                className="w-full h-auto rounded-xl object-cover aspect-[4/5] md:aspect-square"
              />
              <div className="absolute top-6 right-6">
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  PRE-ORDER
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/10 to-purple-600/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Now Available for Pre-order
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Serenity Scrolls <br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Reflection Journal</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Discover the magical world of Serenity Scrolls before anyone else. Step into a deeper spiritual practice with guided reflections for every emotion.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: BookOpen, text: "All 96 verses with immersive 2-page spreads" },
                { icon: Heart, text: "Guided prayers and reflections for 6 core emotions" },
                { icon: Sparkles, text: "Includes free 30-day access to the AI Servant" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <feature.icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 space-y-8 border-t border-border/50">
              <Button 
                size="lg" 
                onClick={addToCart}
                className="w-full sm:w-auto h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl transition-all hover:scale-105 group" 
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Pre Order
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default PresaleJournal;
