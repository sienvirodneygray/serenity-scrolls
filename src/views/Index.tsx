import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { FeaturedBlogPosts } from "@/components/FeaturedBlogPosts";
import { NewsletterModal } from "@/components/NewsletterModal";
import { RecentPurchasePopup } from "@/components/RecentPurchasePopup";
import { Navbar } from "@/components/Navbar";
import { StructuredData } from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";
import { Sparkles, ArrowRight, BookOpen, Heart, ExternalLink, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import tubeProduct from "@/assets/tube.jpeg";
import tubeProductReal from "@/assets/tube-product-real.png";
import journalProduct from "@/assets/journal.png";
import journalProductReal from "@/assets/journal-product.jpg";
import servantProduct from "@/assets/servant.jpeg";
import servantProductReal from "@/assets/servant-product.jpg";
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

      {/* Now Available Banner */}
      <section className="py-6 bg-gradient-to-r from-purple-600 to-pink-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">📖 The Serenity Scrolls Reflection Journal is Now Available!</h2>
          <p className="text-white/90 mb-4">Slow down with Scripture, pray honestly, and turn each verse into a deeper moment of reflection.</p>
          <Link
            href="/reflection-journal"
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Order the Journal <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Choose Your Serenity Scrolls Experience Grid */}
      <section className="py-16 bg-muted/20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">Serenity Scrolls Experience</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Serenity Scrolls Experience
            </h2>
            <p className="text-lg text-muted-foreground">
              Begin with the guided reflection journal, explore the AI Scripture companion, or shop the physical color-coded scrolls.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 1. Reflection Journal */}
            <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="overflow-hidden h-56 relative">
                <img
                  src={journalProductReal.src}
                  alt="Christian Reflection Journal for prayer and Scripture"
                  loading="lazy"
                  className="h-full w-full object-cover bg-muted transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  Available Now
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-2xl font-bold mb-3">Reflection Journal</h3>
                <p className="text-sm font-semibold text-foreground mb-1">Best for:</p>
                <p className="text-muted-foreground text-sm mb-4">Prayer, daily journaling, emotional reflection, and going deeper with Scripture.</p>
                <p className="text-sm font-semibold text-foreground mb-1">Includes:</p>
                <p className="text-muted-foreground text-sm mb-5">Guided prompts for Scripture reflection, gratitude, and 2-page spreads for all 96 verses.</p>
                <Button className="mt-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold" asChild>
                  <Link href="/reflection-journal">Order the Journal</Link>
                </Button>
              </div>
            </div>

            {/* 2. AI Servant */}
            <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="overflow-hidden h-56 relative">
                <img
                  src={servantProductReal.src}
                  alt="AI Servant Scripture companion and physical Serenity Scrolls Tube"
                  loading="lazy"
                  className="h-full w-full object-cover bg-muted transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  Interactive AI
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-2xl font-bold mb-3">AI Servant</h3>
                <p className="text-sm font-semibold text-foreground mb-1">Best for:</p>
                <p className="text-muted-foreground text-sm mb-4">Scripture-based reflection prompts and faith-centered encouragement anytime.</p>
                <p className="text-sm font-semibold text-foreground mb-1">Includes:</p>
                <p className="text-muted-foreground text-sm mb-5">Personalized Bible verse guidance, reflection prompts, and emotional support rooted in Scripture.</p>
                <Button className="mt-auto bg-primary hover:bg-primary/95 font-bold" asChild>
                  <Link href="/servant-landing">Explore AI Servant</Link>
                </Button>
              </div>
            </div>

            {/* 3. Serenity Scrolls Tube */}
            <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="overflow-hidden h-56 relative">
                <img
                  src={tubeProductReal.src}
                  alt="Serenity Scrolls Bible verse scrolls in keepsake tube"
                  loading="lazy"
                  className="h-full w-full object-contain p-4 bg-muted/30 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                  Bestseller
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-2xl font-bold mb-3">Serenity Scrolls Tube</h3>
                <p className="text-sm font-semibold text-foreground mb-1">Best for:</p>
                <p className="text-muted-foreground text-sm mb-4">Daily Scripture encouragement and meaningful Christian gifting.</p>
                <p className="text-sm font-semibold text-foreground mb-1">Includes:</p>
                <p className="text-muted-foreground text-sm mb-5">96 color-coded Bible verse scrolls organized by emotion in a premium keepsake tube.</p>
                <Button variant="outline" className="mt-auto border-2 font-bold hover:bg-muted/50" asChild>
                  <a href="#tube-scrolls-section">Shop Serenity Scrolls</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-background border-b border-border/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Journey to Peace</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three beautifully crafted products designed to bring Scripture into your emotional wellness practice
            </p>
          </div>

          <div className="space-y-24">
            {/* Showcase 1: Reflection Journal */}
            <div id="journal-section" className="scroll-mt-24 py-4">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <ProductCard
                  title="Serenity Scrolls Reflection Journal"
                  description="Your companion for deep spiritual reflection and growth"
                  image={journalProductReal.src}
                  price={39.99}
                  badge="New"
                  features={[
                    "All 96 KJV verses with immersive 2-page spreads",
                    "10 reflection questions per verse",
                    "Guided prayers and emotional processing guides",
                    "Space for personal notes and spiritual insights",
                    "Includes access code for 30 days of the AI Servant",
                  ]}
                  onAddToCart={() => addToCart(productIds['78-SH1V-JG7I'])}
                />

                {/* Journal Gallery */}
                <div className="space-y-6">
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">Inside the Journal</h3>
                    <p className="text-muted-foreground text-sm">
                      Peek inside the beautiful guided spreads designed to enrich your quiet time.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <img src={journal1.src} alt="Journal cover and pages" className="rounded-xl object-cover aspect-square w-full shadow-sm hover:scale-105 transition-transform duration-300 cursor-pointer" />
                    <img src={journal2.src} alt="Journal emotion tabs" className="rounded-xl object-cover aspect-square w-full shadow-sm hover:scale-105 transition-transform duration-300 cursor-pointer" />
                    <img src={journal4.src} alt="Journal reflection pages" className="rounded-xl object-cover aspect-square w-full shadow-sm hover:scale-105 transition-transform duration-300 cursor-pointer" />
                    <img src={journal5.src} alt="Journal guided prompts" className="rounded-xl object-cover aspect-square w-full shadow-sm hover:scale-105 transition-transform duration-300 cursor-pointer" />
                  </div>
                  <div className="bg-muted/50 rounded-xl p-5 border border-border">
                    <p className="text-sm text-muted-foreground italic text-center">
                      "Our journal passages are drawn from the King James Version (KJV), chosen for its timeless language, poetic beauty, and deep roots in Christian tradition."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase 2: AI Servant */}
            <div id="servant-section" className="scroll-mt-24 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-500 to-amber-500 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-gradient-to-br from-purple-50/90 to-amber-50/90 dark:from-purple-950/20 dark:to-amber-950/20 border border-purple-200/50 dark:border-purple-800/30 rounded-3xl p-8 md:p-12 text-center space-y-8 backdrop-blur-sm">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                      <Sparkles className="w-12 h-12 text-white animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                        ✦ AI Spiritual Companion
                      </span>
                      <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Serenity Scrolls Servant</h3>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Your AI-powered spiritual companion. Share your mood or scroll color,
                        and receive Scripture snapshots, reflections, journal prompts, and one small step — all guided by faith.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left bg-background/50 backdrop-blur-sm p-6 rounded-2xl border border-border">
                      <div className="flex items-start gap-3">
                        <span className="text-purple-500 text-lg">✦</span>
                        <div>
                          <h4 className="font-semibold text-sm">Mood-based Scripture</h4>
                          <p className="text-xs text-muted-foreground">Find matching Bible verses instantly for whatever you are feeling.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-purple-500 text-lg">✦</span>
                        <div>
                          <h4 className="font-semibold text-sm">Personalized Reflections</h4>
                          <p className="text-xs text-muted-foreground">Get thoughtful devotional material customized to your current walk.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-purple-500 text-lg">✦</span>
                        <div>
                          <h4 className="font-semibold text-sm">Guided Prayer Prompts</h4>
                          <p className="text-xs text-muted-foreground">Go deeper with daily prayer guidance to help build a lasting rhythm.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-purple-500 text-lg">✦</span>
                        <div>
                          <h4 className="font-semibold text-sm">Free Trial Included</h4>
                          <p className="text-xs text-muted-foreground">Get a 30-day trial automatically with any Scrolls purchase.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                      <Link
                        href="/servant-landing"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        Explore AI Servant
                      </Link>
                      <Link
                        href="/unlock"
                        className="inline-flex items-center justify-center gap-2 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold py-3.5 px-8 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all hover:scale-105"
                      >
                        Already purchased? Unlock Access
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Coming soon on Amazon as a digital product • Free 30-day trial included with every Scrolls purchase
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase 3: Serenity Scrolls Tube */}
            <div id="tube-scrolls-section" className="scroll-mt-24 py-4">
              <div className="max-w-2xl mx-auto">
                <ProductCard
                  title="Serenity Scrolls Tube"
                  description="96 color-coded Bible verse scrolls organized by emotion"
                  image={tubeProductReal.src}
                  price={24.99}
                  badge="Bestseller"
                  features={[
                    "96 carefully curated Bible verses",
                    "Color-coded for 6 emotions: Grateful, Frustrated, Anxious, Happy, Sad, Troubled",
                    "Portable keepsake tube - take peace anywhere",
                    "Draw a scroll that speaks to your current mood",
                    "Perfect for daily devotions or group sharing",
                  ]}
                  onAddToCart={() => addToCart(productIds['PI-8N6M-AB86'])}
                />
              </div>
            </div>
          </div>
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

      {/* B2B / Organization Hub CTA */}
      <section className="py-20 bg-background border-b border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative group overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 p-8 md:p-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  ✝ Church &amp; Organization Partnerships
                </span>
                <h3 className="text-3xl font-bold tracking-tight">Serenity Scrolls for Groups &amp; Communities</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bring Scripture-based emotional encouragement, wholesale devotional kits, and bullying response frameworks to your church, school, or counselors.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0 justify-center">
                <Button className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5" asChild>
                  <Link href="/b2b">
                    Partnership Hub <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 text-sm font-medium">
              <Link href="/shop" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                Shop Christian Scripture gifts
              </Link>
              <Link href="/reflection-journal" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                Christian Reflection Journal
              </Link>
              <Link href="/servant-landing" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                AI Scripture companion
              </Link>
              <Link href="/b2b" className="rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/40 hover:text-primary transition-colors">
                Church &amp; Group Partnerships
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
      <RecentPurchasePopup />
    </div>
  );
};

export default Index;
