import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import heroImage from "@/assets/hero-image.jpg";
import logo from "@/assets/logo.png";

export const Hero = () => {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden py-24 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      
      {/* Hero Image with overlay */}
      <div className="absolute inset-0 opacity-30">
        <img
          src={heroImage.src}
          alt="Serenity Scrolls Bible verse scrolls displayed with warm rainbow light"
          width={1600}
          height={1200}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={logo.src}
              alt="Serenity Scrolls"
              width={400}
              height={176}
              className="h-28 md:h-32 w-auto drop-shadow-lg"
            />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Find Peace in{" "}
            <span className="bg-gradient-to-r from-[hsl(var(--grateful))] via-[hsl(var(--primary))] to-[hsl(var(--anxious))] bg-clip-text text-transparent">
              Every Emotion
            </span>{" "}
            Through Scripture
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            96 color-coded Bible verses for when you're grateful, frustrated, anxious, happy, sad, or troubled. 
            Your companion for emotional wellness and spiritual growth.
          </p>

          {/* Emotion badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {[
              { label: "Grateful", color: "grateful" },
              { label: "Frustrated", color: "frustrated" },
              { label: "Anxious", color: "anxious" },
              { label: "Happy", color: "happy" },
              { label: "Sad", color: "sad" },
              { label: "Troubled", color: "troubled" },
            ].map(({ label, color }) => (
              <div
                key={label}
                className="px-4 py-2 rounded-full text-sm font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: `hsl(var(--${color}-light))`,
                  color: `hsl(var(--${color}))`,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <Link href="/shop">Shop Serenity Scrolls</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
              <Link href="/bible-verse-scrolls-for-anxiety-and-peace">
                Bible Verse Scrolls for Anxiety and Peace
              </Link>
            </Button>
            <Button
              size="lg"
              onClick={scrollToProducts}
              variant="ghost"
              className="h-14 px-8 text-lg"
            >
              Explore Products
              <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-6">
            Created to help real emotions meet the steady comfort of God's Word.
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
