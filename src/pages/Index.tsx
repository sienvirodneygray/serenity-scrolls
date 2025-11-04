import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Testimonials } from "@/components/Testimonials";
import { NewsletterModal } from "@/components/NewsletterModal";
import { Navbar } from "@/components/Navbar";
import tubeProduct from "@/assets/tube-product.jpg";
import journalProduct from "@/assets/journal-product.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />

      {/* Products Section */}
      <section id="products" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Journey to Peace</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Two beautifully crafted products designed to bring Scripture into your emotional wellness practice
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <ProductCard
              title="Serenity Scrolls Tube"
              description="96 color-coded Bible verse scrolls organized by emotion"
              image={tubeProduct}
              badge="Bestseller"
              amazonUrl="https://pixelfy.me/NkTDDE"
              features={[
                "96 carefully curated Bible verses",
                "Color-coded for 5 emotions: Grateful, Anxious, Happy, Sad, Troubled",
                "Portable tube design - take peace anywhere",
                "Draw a scroll that speaks to your current mood",
                "Perfect for daily devotions or group sharing",
              ]}
            />

            <ProductCard
              title="Serenity Scrolls Reflection Journal"
              description="Your companion for deep spiritual reflection and growth"
              image={journalProduct}
              amazonUrl="https://pixelfy.me/NkTDDE"
              features={[
                "All 96 verses with 2-page spreads",
                "10 reflection questions per verse",
                "Guided prayers for each emotion",
                "Space for personal notes and insights",
                "Includes product access code for AI Servant",
              ]}
            />
          </div>
        </div>
      </section>

      <Testimonials />

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
                Whether you're overflowing with gratitude, wrestling with anxiety, celebrating joy, 
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
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Serenity Scrolls. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Find peace in every emotion through Scripture
          </p>
        </div>
      </footer>

      <NewsletterModal />
    </div>
  );
};

export default Index;
