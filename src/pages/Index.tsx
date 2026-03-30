import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { FeaturedBlogPosts } from "@/components/FeaturedBlogPosts";
import { NewsletterModal } from "@/components/NewsletterModal";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { WEBSITE_AMAZON_URL, AMAZON_PRODUCTS } from "@/lib/amazonAttribution";
import { Sparkles } from "lucide-react";
import tubeProduct from "@/assets/tube-product-real.png";
import journalProduct from "@/assets/journal-product.jpg";
import journal1 from "@/assets/journal-1.jpg";
import journal2 from "@/assets/journal-2.jpg";
import journal4 from "@/assets/journal-4.jpg";
import journal5 from "@/assets/journal-5.jpg";
import journal6 from "@/assets/journal-6.jpg";
import journal7 from "@/assets/journal-7.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />

      {/* Pre-order Banner */}
      <section className="py-6 bg-gradient-to-r from-purple-600 to-pink-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">📖 The Serenity Scrolls Journal is Coming!</h2>
          <p className="text-white/90 mb-4">Be among the first to get your copy — pre-order now on Amazon.</p>
          <Link
            to="/presale-journal"
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
                  image={tubeProduct}
                  badge="Bestseller"
                  amazonUrl={WEBSITE_AMAZON_URL}
                  features={[
                    "96 carefully curated Bible verses",
                    "Color-coded for 6 emotions: Grateful, Frustrated, Anxious, Happy, Sad, Troubled",
                    "Portable tube design - take peace anywhere",
                    "Draw a scroll that speaks to your current mood",
                    "Perfect for daily devotions or group sharing",
                  ]}
                />
              </div>
            </TabsContent>

            <TabsContent value="journal" className="mt-0">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <ProductCard
                    title="Serenity Scrolls Reflection Journal"
                    description="Your companion for deep spiritual reflection and growth"
                    image={journalProduct}
                    badge="Pre‑order"
                    amazonUrl={import.meta.env.VITE_AMAZON_PREORDER_URL || 'https://www.amazon.com/dp/B0GGV8FQCM?utm_source=presale&utm_medium=amazon&utm_campaign=journal_launch&utm_term=serenity_scrolls_journal'}
                    features={[
                      "All 96 verses with 2-page spreads",
                      "10 reflection questions per verse",
                      "Guided prayers for each emotion",
                      "Space for personal notes and insights",
                      "Includes product access code for AI Servant",
                    ]}
                  />

                  {/* Journal Gallery */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-center mb-4">Inside the Journal</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <img src={journal1} alt="Journal cover and pages" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
                      <img src={journal2} alt="Journal emotion tabs" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
                      <img src={journal4} alt="Journal reflection pages" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
                      <img src={journal5} alt="Journal guided prompts" className="rounded-lg object-cover aspect-square w-full hover:scale-105 transition-transform cursor-pointer" />
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
                      to="/servant-landing"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4" />
                      Learn More
                    </Link>
                    <Link
                      to="/unlock"
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
                to="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/data-protection-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Data Protection</Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      <NewsletterModal />
    </div>
  );
};

export default Index;
