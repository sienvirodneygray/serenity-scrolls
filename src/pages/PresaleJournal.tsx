import React from 'react';
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Sparkles, BookOpen, Heart } from "lucide-react";
import QRCode from '../components/QRCode';
import journalProduct from "@/assets/journal-product.jpg";

const AMAZON_PREORDER_URL = import.meta.env.VITE_AMAZON_PREORDER_URL || 'https://www.amazon.com/dp/B0GGV8FQCM?utm_source=presale&utm_medium=amazon&utm_campaign=journal_launch&utm_term=serenity_scrolls_journal';

const PresaleJournal: React.FC = () => {
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
                src={journalProduct} 
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
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Coming Soon to Amazon
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
                className="w-full sm:w-auto h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl transition-all hover:scale-105 group" 
                asChild
              >
                <a href={AMAZON_PREORDER_URL} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Pre-order on Amazon
                </a>
              </Button>

              {/* Desktop QR Code Block */}
              <div className="hidden sm:flex items-center gap-6 bg-muted/40 p-4 rounded-2xl border border-border/50 max-w-sm">
                <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                  <QRCode url={AMAZON_PREORDER_URL} size={80} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Browsing on Desktop?</p>
                  <p className="text-xs text-muted-foreground leading-snug">Scan the code to quickly check out on your mobile device.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default PresaleJournal;
