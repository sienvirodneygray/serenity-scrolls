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
                Christian Reflection Journal for Prayer and Scripture
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Slow down with Scripture, pray honestly, and turn each Serenity Scrolls verse into a deeper moment of gratitude, surrender, emotional healing, and spiritual growth.
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

      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <div className="space-y-8">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                <h2 className="text-3xl font-bold mb-4">A Guided Journal for Meeting Your Emotions With God</h2>
                <div className="space-y-4 text-foreground/80 leading-relaxed">
                  <p>
                    The Serenity Scrolls Reflection Journal is designed to help you slow down, pray honestly, reflect on Scripture, and process your emotions with God. Use it alongside Serenity Scrolls to turn a single Bible verse into a deeper moment of prayer, gratitude, surrender, and spiritual growth.
                  </p>
                  <p>
                    Each journal session gives you space to name what you feel, sit with the verse you pulled, notice what God may be inviting you to release or remember, and write a faithful next step. It is simple enough for beginners and meaningful enough for anyone who wants a more consistent Scripture reflection practice.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                <h2 className="text-3xl font-bold mb-4">Who the Reflection Journal Is For</h2>
                <p className="text-foreground/80 leading-relaxed mb-5">
                  This Christian reflection journal is for people who want more than a quick verse of the day. It is for anxious hearts that need to breathe, grateful hearts that want to remember God's goodness, grieving hearts that need comfort, and busy hearts that need a quiet place to listen.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "Women building a peaceful prayer journaling rhythm",
                    "Bible study groups looking for Scripture reflection prompts",
                    "Gift givers who want something devotional and meaningful",
                    "Parents and families helping loved ones connect emotions with Scripture",
                    "New journalers who need gentle structure",
                    "Serenity Scrolls users who want to go deeper with each verse",
                  ].map((item) => (
                    <div key={item} className="rounded-lg bg-muted/40 p-4 text-sm text-foreground/80">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                <h2 className="text-3xl font-bold mb-4">How to Use It With Serenity Scrolls</h2>
                <ol className="space-y-4 text-foreground/80">
                  <li><strong>1. Choose your emotion.</strong> Begin with the color that best matches what you are carrying today.</li>
                  <li><strong>2. Draw a Scripture scroll.</strong> Read the verse slowly, more than once if needed.</li>
                  <li><strong>3. Open the journal.</strong> Write the verse, name your emotion, and answer the guided prompts.</li>
                  <li><strong>4. Pray honestly.</strong> Turn your reflection into a prayer of gratitude, lament, confession, trust, or surrender.</li>
                  <li><strong>5. Return later.</strong> Revisit past entries to notice growth, answered prayers, and recurring themes God is shaping in you.</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                <h2 className="text-3xl font-bold mb-4">Benefits of a Scripture Reflection Journal</h2>
                <div className="grid sm:grid-cols-2 gap-5 text-sm text-muted-foreground">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Emotional clarity</h3>
                    <p>Name what you feel without shame, then let Scripture speak to that real place.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Deeper prayer</h3>
                    <p>Move from quick thoughts to honest conversation with God about your day.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Gratitude practice</h3>
                    <p>Notice blessings, answered prayers, and the quiet evidence of God's faithfulness.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Daily devotional rhythm</h3>
                    <p>Create a repeatable quiet-time habit that pairs beautifully with Serenity Scrolls.</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <h2 className="text-2xl font-bold mb-3">Sample Prayer Journal Prompts</h2>
                <ul className="space-y-3 text-sm text-foreground/80">
                  <li>What emotion am I bringing before God today?</li>
                  <li>What word or phrase in this verse stands out to me?</li>
                  <li>What does this Scripture reveal about God's character?</li>
                  <li>What burden can I surrender in prayer?</li>
                  <li>What is one small faithful step I can take today?</li>
                  <li>What am I grateful for, even in this season?</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-3">Pre-Order the Reflection Journal</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Reserve your Serenity Scrolls Reflection Journal and prepare for a deeper Scripture-centered rhythm of prayer, gratitude, and emotional reflection.
                </p>
                <Button onClick={addToCart} className="w-full">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Pre-Order the Journal
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Reflection Journal FAQ</h2>
                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold mb-1">Do I need Serenity Scrolls to use the journal?</h3>
                    <p className="text-sm text-muted-foreground">The journal is designed to pair with Serenity Scrolls, but you can also use it with your own Bible reading and prayer time.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Is this good for beginners?</h3>
                    <p className="text-sm text-muted-foreground">Yes. The prompts are gentle and structured so you never have to stare at a blank page wondering what to write.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Can groups use it together?</h3>
                    <p className="text-sm text-muted-foreground">Yes. Bible study groups, families, and church small groups can use the prompts for discussion, prayer, and personal reflection.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Does it replace Scripture reading?</h3>
                    <p className="text-sm text-muted-foreground">No. The journal is a devotional companion that points you back to God's Word, prayer, and wise Christian community.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PresaleJournal;
