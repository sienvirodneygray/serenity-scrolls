import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { FeaturedBlogPosts } from "@/components/FeaturedBlogPosts";
import { NewsletterModal } from "@/components/NewsletterModal";
import { Navbar } from "@/components/Navbar";
import { StructuredData } from "@/components/StructuredData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";
import { WEBSITE_AMAZON_URL, AMAZON_PRODUCTS } from "@/lib/amazonAttribution";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import tubeProduct from "@/assets/tube-product-real.png";
import journalProduct from "@/assets/journal-product.jpg";
import journal1 from "@/assets/journal-1.jpg";
import journal2 from "@/assets/journal-2.jpg";
import journal4 from "@/assets/journal-4.jpg";
import journal5 from "@/assets/journal-5.jpg";
import journal6 from "@/assets/journal-6.jpg";
import journal7 from "@/assets/journal-7.jpg";

const Index = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [productIds, setProductIds] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch real product IDs by amazon_sku so we don't hardcode UUIDs
    const loadProductIds = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, amazon_sku')
        .in('amazon_sku', ['PI-8N6M-AB86', '78-SH1V-JG7I']);
      if (data) {
        const map: Record<string, string> = {};
        for (const p of data) {
          if (p.amazon_sku) map[p.amazon_sku] = p.id;
        }
        setProductIds(map);
      }
    };
    loadProductIds();
  }, []);

  const addToCart = async (productId: string) => {
    if (!productId) {
      toast({ title: 'Product not found', description: 'This product is not yet available for direct checkout.', variant: 'destructive' });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();

      let anonSessionId: string | null = null;
      if (!session) {
        anonSessionId = typeof window !== 'undefined'
          ? window.localStorage.getItem('session_id')
          : null;
        if (!anonSessionId) {
          anonSessionId = crypto.randomUUID();
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('session_id', anonSessionId);
          }
        }
        // @ts-ignore - set header for RLS policy
        supabase.rest.headers['x-session-id'] = anonSessionId;
      }

      const matchColumn = session ? 'user_id' : 'session_id';
      const matchValue = session ? session.user.id : anonSessionId!;

      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', productId)
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
            product_id: productId,
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
    <div className="min-h-screen">
      <StructuredData
        data={breadcrumbJsonLd([{ name: "Home", path: "/" }])}
      />
      <Navbar />
      <Hero />

      {/* Pre-order Banner */}
      <section className="py-6 bg-gradient-to-r from-purple-600 to-pink-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">📖 The Serenity Scrolls Journal is Coming!</h2>
          <p className="text-white/90 mb-4">Be among the first to get your copy — pre-order now on Amazon.</p>
          <Link
            href="/presale-journal"
            className="inline-block bg-white text-purple-700 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Pre‑order the Journal →
          </Link>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Journey to Peace</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Two beautifully crafted products designed to bring Scripture into your emotional wellness practice
            </p>
          </div>

          <Tabs defaultValue="scrolls" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto">
              <TabsTrigger value="scrolls" className="text-lg py-3">Serenity Scrolls Tube</TabsTrigger>
              <TabsTrigger value="journal" className="text-lg py-3">Reflection Journal</TabsTrigger>
              <TabsTrigger value="servant" className="text-lg py-3">AI Servant</TabsTrigger>
            </TabsList>

            <TabsContent value="scrolls" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <ProductCard
                  title="Serenity Scrolls Tube"
                  description="96 color-coded Bible verse scrolls organized by emotion"
                  image={tubeProduct.src}
                  price={24.99}
                  badge="Bestseller"
                  amazonUrl={WEBSITE_AMAZON_URL}
                  features={[
                    "96 carefully curated Bible verses",
                    "Color-coded for 6 emotions: Grateful, Frustrated, Anxious, Happy, Sad, Troubled",
                    "Portable tube design - take peace anywhere",
                    "Draw a scroll that speaks to your current mood",
                    "Perfect for daily devotions or group sharing",
                  ]}
                  onAddToCart={() => addToCart(productIds['PI-8N6M-AB86'])}
                />
              </div>
            </TabsContent>

            <TabsContent value="journal" className="mt-0">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <ProductCard
                    title="Serenity Scrolls Reflection Journal"
                    description="Your companion for deep spiritual reflection and growth"
                    image={journalProduct.src}
                    price={39.99}
                    badge="Pre‑order"
                    amazonUrl={process.env.NEXT_PUBLIC_AMAZON_PREORDER_URL || 'https://www.amazon.com/dp/B0GGV8FQCM?utm_source=presale&utm_medium=amazon&utm_campaign=journal_launch&utm_term=serenity_scrolls_journal'}
                    features={[
                      "All 96 verses with 2-page spreads",
                      "10 reflection questions per verse",
                      "Guided prayers for each emotion",
                      "Space for personal notes and insights",
                      "Includes product access code for AI Servant",
                    ]}
                    onAddToCart={() => addToCart(productIds['78-SH1V-JG7I'])}
                  />

                  {/* Journal Gallery */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-center mb-4">Inside the Journal</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <img src={journal1.src} alt="Journal cover and pages" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
                      <img src={journal2.src} alt="Journal emotion tabs" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
                      <img src={journal4.src} alt="Journal reflection pages" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
                      <img src={journal5.src} alt="Journal guided prompts" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground italic">
                        "Our journal passages are drawn from the King James Version (KJV), chosen for its timeless language, poetic beauty, and deep roots in Christian tradition."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="servant" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-purple-50 to-amber-50 dark:from-purple-950/30 dark:to-amber-950/30 rounded-2xl p-8 text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold">Serenity Scrolls Servant</h3>
                  <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                    Your AI-powered spiritual companion. Share your mood or scroll color,
                    and receive Scripture snapshots, reflections, journal prompts, and one small step — all guided by faith.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto text-left">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      <span className="text-sm">Mood-based Scripture matching</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      <span className="text-sm">Personalized reflections</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      <span className="text-sm">Guided journal prompts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">✦</span>
                      <span className="text-sm">30-day free trial with purchase</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link
                      href="/servant-landing"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4" />
                      Learn More
                    </Link>
                    <Link
                      href="/unlock"
                      className="inline-flex items-center justify-center gap-2 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold py-3 px-8 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
                    >
                      Already purchased? Unlock Access
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Coming soon on Amazon as a digital product • Free 30-day trial included with every Scrolls purchase
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Courage Covenant CTA */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-primary/20 bg-primary/10 text-primary">
                New: Faith-Based Bullying Guidance
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Courage Covenant™
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A Scripture-based bullying guidance course for Christian parents and leaders. Get the 7-step framework to respond with clarity, courage, and safe next steps—not just "pray about it."
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/learn/courage-covenant"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Explore the Course
                </Link>
                <Link
                  href="/learn/courage-covenant/what-actually-happened/conflict-vs-bullying"
                  className="inline-flex items-center justify-center gap-2 border border-primary text-primary font-semibold py-3 px-8 rounded-full hover:bg-primary/10 transition-all"
                >
                  Watch Free Preview
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full max-w-md mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-3xl blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative aspect-[4/3] bg-card border border-border rounded-2xl shadow-card overflow-hidden flex flex-col">
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-xs text-muted-foreground font-medium">Module 1 / Lesson 1</span>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-background to-muted/30">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">🛡️</span>
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-foreground">Conflict vs. Bullying</h3>
                  <p className="text-sm text-muted-foreground">Learn the 4 critical categories to identify exactly what your child is experiencing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <FeaturedBlogPosts />

      <FAQ />

      {/* Story Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Serenity Scrolls was born from a simple truth: we all experience a spectrum of emotions,
                and Scripture has wisdom for every one of them.
              </p>
              <p>
                Whether you're overflowing with gratitude, feeling frustrated, wrestling with anxiety, celebrating joy,
                navigating sadness, or facing troubled times - there's a verse waiting to meet you where you are.
              </p>
              <p>
                Our color-coded system makes it effortless to find the right word at the right time.
                No more endless searching. Just reach for your emotion, and let Scripture guide you home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Landing Page Preview */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Label */}
            <div className="text-center mb-10">
              <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary mb-4">
                Bible verse scrolls for anxiety and peace
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Bible Verse Scrolls for Anxiety, Peace, Gratitude &amp; Daily Encouragement
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                96 color-coded Scripture verses organized by emotion — reach for God's Word exactly when your heart needs it most.
              </p>
            </div>

            {/* Emotion badges strip */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                { name: "Anxious", color: "bg-purple-100 text-purple-800 border-purple-200" },
                { name: "Sad", color: "bg-blue-100 text-blue-800 border-blue-200" },
                { name: "Troubled", color: "bg-pink-100 text-pink-800 border-pink-200" },
                { name: "Frustrated", color: "bg-orange-100 text-orange-800 border-orange-200" },
                { name: "Grateful", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                { name: "Happy", color: "bg-amber-100 text-amber-800 border-amber-200" },
              ].map((emotion) => (
                <span
                  key={emotion.name}
                  className={`rounded-full border px-5 py-2 text-sm font-semibold ${emotion.color}`}
                >
                  {emotion.name}
                </span>
              ))}
            </div>

            {/* How-it-works mini steps */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { step: "1", label: "Choose how you feel", desc: "Pick the color that matches your current emotion." },
                { step: "2", label: "Draw a Scripture scroll", desc: "Open one scroll and read the verse slowly." },
                { step: "3", label: "Pray and reflect", desc: "Ask God what He wants to show you through that verse." },
                { step: "4", label: "Write it down", desc: "Capture your reflection in a journal or notebook." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {item.step}
                  </span>
                  <h3 className="font-semibold mb-1 text-sm">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/bible-verse-scrolls-for-anxiety-and-peace"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Read the Full Guide
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-3">Continue Your Scripture-Centered Practice</h2>
              <p className="text-muted-foreground text-lg">
                Explore the core Serenity Scrolls resources for daily devotion, emotional encouragement, prayer journaling, and faith-based support.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm font-medium">
              <Link href="/shop" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                Shop Christian Scripture gifts
              </Link>
              <Link href="/presale-journal" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                Christian Reflection Journal
              </Link>
              <Link href="/servant-landing" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                AI Scripture companion
              </Link>
              <Link href="/bible-verse-scrolls-for-anxiety-and-peace" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                Bible verse scrolls for anxiety and peace
              </Link>
              <Link href="/blog" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                Bible verses and prayer prompts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-center">
              © {new Date().getFullYear()} Serenity Scrolls. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Find peace in every emotion through Scripture
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:info@serenityscrolls.faith"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                info@serenityscrolls.faith
              </a>
              <span className="text-muted-foreground/30">|</span>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <span className="text-muted-foreground/30">|</span>
              <Link href="/data-protection-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Data Protection</Link>
              <span className="text-muted-foreground/30">|</span>
              <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      <NewsletterModal />
    </div>
  );
};

export default Index;
