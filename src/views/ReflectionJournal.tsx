import React, { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Star, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Feather, 
  Layers, 
  Compass, 
  HelpCircle,
  ArrowRight
} from "lucide-react";
import journalProduct from "@/assets/journal-product.jpg";
import journal1 from "@/assets/journal-1.jpg";
import journal2 from "@/assets/journal-2.jpg";
import journal4 from "@/assets/journal-4.jpg";
import journal5 from "@/assets/journal-5.jpg";
import journal6 from "@/assets/journal-6.jpg";
import journal7 from "@/assets/journal-7.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ReflectionJournal: React.FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [journalId, setJournalId] = useState<string | null>(null);
  
  // Interactive states
  const [activeImage, setActiveImage] = useState<string>(journalProduct.src);
  const [selectedEmotion, setSelectedEmotion] = useState<string>("Happy");

  const galleryImages = [
    { src: journalProduct.src, label: "Cover" },
    { src: journal1.src, label: "Pages Overview" },
    { src: journal2.src, label: "Emotion Spreads" },
    { src: journal4.src, label: "Scripture Devotions" },
    { src: journal5.src, label: "Prayer Workspace" },
    { src: journal6.src, label: "Texture Zoom" },
    { src: journal7.src, label: "Packaging" }
  ];

  // Fully matched and localized emotion database derived from the physical journal spread layout
  const emotionsData: Record<string, {
    verse: string;
    subHeader: string;
    passage: string;
    centralThought: string;
    questionsLeft: string[];
    questionsRight: string[];
    closingPrayer: string;
    activeColor: string; // Used for tabs
    tabSide: 'left' | 'right';
    watercolorAccents: string;
    marginColor: string; // The vertical stripe color class
  }> = {
    Happy: {
      verse: "Psalm 128:2",
      subHeader: "Peace Beyond Understanding",
      passage: "For thou shalt eat the labour of thine hands: happy shalt thou be, and it shall be well with thee.",
      centralThought: "God's peace is stronger than worry, guarding our hearts and thoughts in Christ.",
      questionsLeft: [
        "What situations lately have disturbed my peace of mind?",
        "How can I invite God's peace to protect my thoughts today?",
        "When have I felt peace that didn't make sense in a hard time?",
        "What helps me trust that God's peace is stronger than my worry?",
        "How can prayer and gratitude open my heart to this peace?"
      ],
      questionsRight: [
        "Where do I need God's peace to guard me most right now?",
        "How does focusing on Christ steady my heart in stress?",
        "What helps me keep my thoughts centered on truth and hope?",
        "Who could I share a word of peace with today?",
        "When can I pause to breathe and thank God for His presence?"
      ],
      closingPrayer: "Lord, let Your peace surround me today guarding my heart, calming my mind, and restoring my joy.",
      activeColor: "bg-[#e2e824] text-stone-900 border-[#c4cb18]",
      tabSide: 'left',
      watercolorAccents: "from-yellow-100/30 via-emerald-50/20 to-pink-100/20 dark:from-yellow-950/10 dark:via-stone-900/5 dark:to-pink-950/5",
      marginColor: "bg-[#e2e824]"
    },
    Frustrated: {
      verse: "James 1:19-20",
      subHeader: "Patient and Slow to Anger",
      passage: "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath: For the wrath of man worketh not the righteousness of God.",
      centralThought: "Patience and mildness open our hearts to understand God's timing and peace.",
      questionsLeft: [
        "What ongoing issues or demands are pushing me toward irritation?",
        "How does losing my temper affect my relationships and heart peace?",
        "What is one proactive step I can take to pause before speaking?",
        "How can I practice releasing control of things beyond my reach?",
        "In what ways can a slow and gentle response defuse a tense moment?"
      ],
      questionsRight: [
        "Where do I need Christ's calming presence to steady my hands?",
        "What triggers my immediate defenses, and how can I submit them to Him?",
        "How can I speak truth with grace instead of react in anger?",
        "Who is testing my patience, and how can I pray for them today?",
        "When can I withdraw briefly to reset my mind with His promises?"
      ],
      closingPrayer: "Lord, grant me a quiet, listening heart. Remove my haste, and help me walk in Your gentle truth.",
      activeColor: "bg-[#f43f5e] text-white border-[#e11d48]",
      tabSide: 'left',
      watercolorAccents: "from-rose-100/30 via-purple-50/20 to-blue-100/20 dark:from-rose-950/10 dark:via-stone-900/5 dark:to-blue-950/5",
      marginColor: "bg-[#f43f5e]"
    },
    Anxious: {
      verse: "Philippians 4:6-7",
      subHeader: "Worry Replaced by Prayer",
      passage: "Be careful for nothing; but in everything by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding...",
      centralThought: "Bringing our worries to God with a thankful heart unleashes His guarding peace.",
      questionsLeft: [
        "What specific concern is currently consuming my thoughts?",
        "How can I reframe my worry into a direct, honest prayer?",
        "What am I truly grateful for, even in this stressful moment?",
        "How does focusing on His past faithfulness quiet my fears?",
        "What simple step can I take to hand this issue over to God?"
      ],
      questionsRight: [
        "Where do I feel the heaviest weight, and how can I release it?",
        "How does meditating on His sovereignty settle my racing heart?",
        "Who can I trust to stand with me in prayer today?",
        "What promise in His Word offers direct comfort for my fear?",
        "How can I pause to rest in the assurance of His presence?"
      ],
      closingPrayer: "Lord, I surrender my heavy thoughts to You. Guard my heart and mind with Your perfect peace.",
      activeColor: "bg-[#f97316] text-white border-[#ea580c]",
      tabSide: 'right',
      watercolorAccents: "from-orange-100/30 via-pink-50/20 to-blue-100/20 dark:from-orange-950/10 dark:via-stone-900/5 dark:to-blue-950/5",
      marginColor: "bg-[#f97316]"
    },
    Sad: {
      verse: "Psalm 34:18",
      subHeader: "Nearness in Brokenness",
      passage: "The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
      centralThought: "Our grief or sorrow is met with the tender nearness and healing of our Savior.",
      questionsLeft: [
        "What pain, loss, or disappointment is weighing on my soul today?",
        "How does knowing God is close in my pain offer quiet comfort?",
        "What are the specific blessings I can still notice in this valley?",
        "How can I let Him hold my tears instead of carrying them alone?",
        "In what ways does His constant presence soften my discouragement?"
      ],
      questionsRight: [
        "Where do I need His gentle touch to soothe my hurting heart?",
        "What hopes feel lost, and how can I surrender them to His care?",
        "Who around me is hurting, and how can I share His comfort?",
        "When can I sit quietly with Him and let His love restore me?",
        "What eternal truth can anchor my mind in this season of sorrow?"
      ],
      closingPrayer: "Lord, sit near me in this quiet room. Bind up my wounds and restore the joy of my salvation.",
      activeColor: "bg-[#3b82f6] text-white border-[#2563eb]",
      tabSide: 'right',
      watercolorAccents: "from-blue-100/30 via-purple-50/20 to-pink-100/20 dark:from-blue-950/10 dark:via-stone-900/5 dark:to-pink-950/5",
      marginColor: "bg-[#3b82f6]"
    },
    Grateful: {
      verse: "Psalm 136:1",
      subHeader: "Enduring Mercy and Goodness",
      passage: "O give thanks unto the Lord; for he is good: for his mercy endureth for ever.",
      centralThought: "Recognizing God's endless love changes how we view every detail of our lives.",
      questionsLeft: [
        "What recent answer to prayer deserves my sincere praise today?",
        "How has His mercy been visible in my life over the past week?",
        "What are three simple blessings I often take for granted?",
        "How does a grateful heart protect me from stress and envy?",
        "In what way can I express my thankfulness in action today?"
      ],
      questionsRight: [
        "Where do I see His hand guiding me in difficult circumstances?",
        "How does praise change my focus from what I lack to what I have?",
        "Who in my life is a direct gift from Him that I can encourage?",
        "What scripture passage fills my heart with joy and thanksgiving?",
        "When can I offer a quiet prayer of praise just for who He is?"
      ],
      closingPrayer: "Lord, my heart overflows with gratitude for Your mercy. Thank You for Your endless goodness.",
      activeColor: "bg-[#10b981] text-white border-[#059669]",
      tabSide: 'right',
      watercolorAccents: "from-emerald-100/30 via-yellow-50/20 to-blue-100/20 dark:from-emerald-950/10 dark:via-stone-900/5 dark:to-blue-950/5",
      marginColor: "bg-[#10b981]"
    },
    Troubled: {
      verse: "John 14:27",
      subHeader: "The Gift of Divine Peace",
      passage: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
      centralThought: "His peace is a permanent deposit in our souls, outlasting any worldly chaos.",
      questionsLeft: [
        "What storm or confusing situation is disturbing my inner calm?",
        "How does His gift of peace differ from the temporary safety of this world?",
        "What fear can I actively choose to stop feeding with worry today?",
        "How can I lean on His understanding rather than my own logic?",
        "What promise of Christ anchor my hope in this turbulent season?"
      ],
      questionsRight: [
        "Where does fear seek to paralyze my next faithful steps?",
        "How does remembering His victory over the world soothe my mind?",
        "Who can I build up today by pointing them to His constant peace?",
        "When can I quiet my heart and let Him speak 'Peace, be still'?",
        "What is one practical action I can take to rest in His protection?"
      ],
      closingPrayer: "Lord, let Your divine peace settle deep in my heart. Quiet my fears and hold me safe in Your hands.",
      activeColor: "bg-[#d946ef] text-white border-[#c084fc]",
      tabSide: 'left',
      watercolorAccents: "from-fuchsia-100/30 via-rose-50/20 to-purple-100/20 dark:from-fuchsia-950/10 dark:via-stone-900/5 dark:to-purple-950/5",
      marginColor: "bg-[#d946ef]"
    }
  };

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

  const activeEmotionDetails = emotionsData[selectedEmotion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-background to-background dark:from-purple-950/5 dark:via-background dark:to-background flex flex-col">
      <Navbar />
      
      {/* Load custom elegant handwriting & serif fonts at runtime */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Playfair+Display:ital,wght@0,600;0,800;1,500&display=swap');
        .font-cursive {
          font-family: 'Caveat', 'Dancing Script', 'Brush Script MT', cursive;
        }
        .font-serif-elegant {
          font-family: 'Playfair Display', Georgia, serif;
        }
      `}} />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-20">
        {/* Hero Section */}
        <section className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center mb-24">
          {/* Left: Product Images and Selector */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-card p-2">
                <img 
                  src={activeImage} 
                  alt="Serenity Scrolls Reflection Journal Cover" 
                  className="w-full h-auto rounded-xl object-cover aspect-[4/5] sm:aspect-square transition-all duration-300"
                />
                <div className="absolute top-6 right-6">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-extrabold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest animate-pulse">
                    AVAILABLE NOW
                  </span>
                </div>
              </div>
            </div>

            {/* Thumbnail grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img.src)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-muted transition-all ${
                    activeImage === img.src ? 'border-purple-600 ring-2 ring-purple-500/20 scale-105' : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  aria-label={`View ${img.label}`}
                >
                  <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Pitch & Buy Block */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/10 to-purple-600/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                Slow Down and Connect with God
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
                Serenity Scrolls <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Reflection Journal</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <span className="text-sm font-semibold text-muted-foreground">5.0 / 5.0 Rating (48 reviews)</span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Slow down with Scripture, pray honestly, and turn each daily Bible verse into a deeper moment of emotional healing, gratitude, surrender, and spiritual growth. Beautiful KJV-driven guided prompts help you process exactly what your heart is carrying today.
              </p>
            </div>

            {/* Core Feature Bullet Points */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: BookOpen, title: "All 96 KJV Verses", desc: "Two-page spread workspace per verse" },
                { icon: Heart, title: "Emotion-Led Prompts", desc: "Tailored structures for 6 key feelings" },
                { icon: Feather, title: "Guided Meditations", desc: "Structured prompts for prayer rhythm" },
                { icon: Layers, title: "Accessory Bundle", desc: "Bonus 30-day AI Servant access included" }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start bg-card/40 border border-border/40 p-4 rounded-xl">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price and Checkout CTA */}
            <div className="pt-6 border-t border-border/50 space-y-5">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-foreground">$39.99</span>
                <span className="text-lg text-muted-foreground line-through font-semibold">$49.99</span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1 rounded-full">SAVE 20%</span>
              </div>

              <div className="space-y-4">
                <Button 
                  size="lg" 
                  onClick={addToCart}
                  className="w-full h-16 px-8 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all group" 
                >
                  <ShoppingCart className="mr-3 h-6 w-6 group-hover:rotate-6 transition-transform" />
                  Order the Journal Now
                </Button>
                
                {/* Micro trust icons */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-semibold">Secure Checkout</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1 border-x border-border">
                    <Truck className="w-5 h-5 text-purple-600" />
                    <span className="text-[10px] font-semibold">Fast Shipping</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <RefreshCw className="w-5 h-5 text-pink-600" />
                    <span className="text-[10px] font-semibold">Satisfaction Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Live Digital Open-Book Spread Demo (Replacing "A Peek Inside" with the Actual Photo Replica) */}
        <section className="py-20 border-y border-border/40 mb-20 bg-gradient-to-b from-transparent via-purple-50/20 to-transparent dark:via-purple-950/5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-extrabold text-purple-600 uppercase tracking-widest mb-3">Live Interactive Demo</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold mb-4">A Peek Inside the Journal</h3>
            <p className="text-muted-foreground text-sm sm:text-base px-4">
              The journal features beautiful color-coded pages linked to emotional states. Select an emotion tab from the margins to preview the exact layout, timeless KJV Scripture, and guided reflections printed inside:
            </p>

            {/* Mobile Tab Selectors (Failsafe for small viewports where sticking side tabs are hidden) */}
            <div className="flex flex-wrap justify-center gap-2 mt-8 lg:hidden px-4">
              {Object.keys(emotionsData).map((emotion) => {
                const isActive = selectedEmotion === emotion;
                const details = emotionsData[emotion];
                return (
                  <button
                    key={emotion}
                    onClick={() => setSelectedEmotion(emotion)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                      isActive 
                        ? `${details.activeColor} scale-105 shadow-md`
                        : 'border-border/60 bg-card text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {emotion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* High-Fidelity Open Notebook Spread flat lay on Wooden Table */}
          <div className="max-w-6xl mx-auto px-4 lg:px-14 py-8">
            
            {/* Notebook Spread relative container - must be overflow-visible so side tabs can stick out! */}
            <div className="relative grid md:grid-cols-2 gap-0.5 rounded-[1.5rem] md:rounded-[2rem] overflow-visible shadow-[0_25px_50px_rgba(0,0,0,0.25)] border border-stone-300/80 dark:border-stone-800/40 bg-stone-250/90 dark:bg-stone-900/90 p-1.5 sm:p-3 md:p-4">
                
                {/* 1. Sticking Tabs - Left Page Edge (Desktop only) */}
                <div className="absolute right-full top-16 flex flex-col gap-6 z-40 mr-[-1px] hidden lg:flex pointer-events-auto">
                  {Object.keys(emotionsData)
                    .filter(key => emotionsData[key].tabSide === 'left')
                    .map((emotion) => {
                      const isActive = selectedEmotion === emotion;
                      const details = emotionsData[emotion];
                      return (
                        <button
                          key={emotion}
                          onClick={() => setSelectedEmotion(emotion)}
                          className={`w-11 h-20 text-center flex items-center justify-center rounded-l-xl border-y border-l text-[10px] font-extrabold tracking-widest uppercase transition-all duration-300 select-none cursor-pointer [writing-mode:vertical-lr] rotate-180 origin-center pointer-events-auto ${
                            isActive 
                              ? `${details.activeColor} w-14 -translate-x-2 shadow-[-5px_5px_10px_rgba(0,0,0,0.3)] z-50`
                              : 'bg-[#fbfaf8]/95 border-stone-300 text-stone-500 hover:bg-[#faf9f6] hover:-translate-x-1 hover:z-50 shadow-sm dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400'
                          }`}
                        >
                          {emotion}
                        </button>
                      );
                    })}
                </div>

                {/* 2. Sticking Tabs - Right Page Edge (Desktop only) */}
                <div className="absolute left-full top-16 flex flex-col gap-6 z-40 ml-[-1px] hidden lg:flex pointer-events-auto">
                  {Object.keys(emotionsData)
                    .filter(key => emotionsData[key].tabSide === 'right')
                    .map((emotion) => {
                      const isActive = selectedEmotion === emotion;
                      const details = emotionsData[emotion];
                      return (
                        <button
                          key={emotion}
                          onClick={() => setSelectedEmotion(emotion)}
                          className={`w-11 h-20 text-center flex items-center justify-center rounded-r-xl border-y border-r text-[10px] font-extrabold tracking-widest uppercase transition-all duration-300 select-none cursor-pointer [writing-mode:vertical-lr] pointer-events-auto ${
                            isActive 
                              ? `${details.activeColor} w-14 translate-x-2 shadow-[5px_5px_10px_rgba(0,0,0,0.3)] z-50`
                              : 'bg-[#fbfaf8]/95 border-stone-300 text-stone-500 hover:bg-[#faf9f6] hover:translate-x-1 hover:z-50 shadow-sm dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400'
                          }`}
                        >
                          {emotion}
                        </button>
                      );
                    })}
                </div>

                {/* 3. Gold Spiral Wire Comb Loops Binding (Central Gutter) */}
                <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 flex flex-col justify-between items-center z-30 pointer-events-none select-none w-10 hidden md:flex">
                  {[...Array(22)].map((_, i) => (
                    <div key={i} className="relative w-full flex justify-between items-center h-5">
                      {/* Left Punched Hole */}
                      <div className="w-2.5 h-3.5 rounded bg-stone-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)] border border-stone-800/40" />
                      
                      {/* Gold double-spiral wire loop */}
                      <div className="absolute left-1/2 -translate-x-1/2 w-5 h-8 rounded-full border-[2.5px] border-amber-500 bg-gradient-to-r from-amber-600 via-yellow-100 to-amber-700 shadow-[0_3px_5px_rgba(0,0,0,0.3),_inset_0_1px_2px_rgba(255,255,255,0.45)] transform -rotate-12 z-30" />
                      
                      {/* Right Punched Hole */}
                      <div className="w-2.5 h-3.5 rounded bg-stone-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)] border border-stone-800/40" />
                    </div>
                  ))}
                </div>

                {/* 4. Left Page (KJV Scripture, Statement & Questions 1-5) */}
                <div className="bg-background dark:bg-stone-950 p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl md:rounded-l-2xl md:rounded-r-none flex flex-col justify-between min-h-[660px] border-r border-stone-200/50 dark:border-stone-800/40 relative overflow-hidden transition-all duration-500 shadow-md">
                  
                  {/* Watercolor Blend background wash */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    <div className="absolute top-1/4 left-1/3 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-yellow-300/15 via-pink-300/15 to-blue-300/15 dark:from-yellow-950/5 dark:via-pink-950/5 dark:to-blue-950/5 blur-[70px]" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeEmotionDetails.watercolorAccents} transition-all duration-700 opacity-90`} />
                  </div>

                  {/* Soft White Cross Watermark overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-5">
                    {/* Vertical shaft */}
                    <div className="w-20 h-[80%] bg-white rounded-full blur-[3px]" />
                    {/* Horizontal beam */}
                    <div className="absolute w-[75%] h-20 bg-white rounded-full blur-[3px] -translate-y-14" />
                  </div>

                  {/* Dynamic Vertical Margin Stripe matching physical page print */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2.5 z-10 transition-colors duration-500 ${activeEmotionDetails.marginColor}`} />

                  {/* Page content */}
                  <div className="relative space-y-7 z-10">
                    {/* Notes cursive header & Page index indicator */}
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/40 dark:border-stone-800/40">
                      <span className="font-cursive text-3xl text-stone-550 dark:text-stone-400 select-none">Notes</span>
                      <span className="font-serif-elegant text-2xl font-bold text-stone-850 dark:text-stone-100 flex-1 text-center pr-12">
                        {activeEmotionDetails.verse}
                      </span>
                    </div>

                    {/* Scripture Reference display */}
                    <div className="text-center space-y-4">
                      <p className="text-[11px] uppercase tracking-widest font-extrabold text-stone-400/90">
                        {activeEmotionDetails.subHeader}
                      </p>
                      <p className="text-[13.5px] sm:text-[14.5px] font-serif-elegant italic text-stone-800 dark:text-stone-200 leading-relaxed max-w-md mx-auto px-2">
                        "{activeEmotionDetails.passage}"
                      </p>
                    </div>

                    {/* Focus / Devotional statement card */}
                    <div className="bg-white/40 dark:bg-stone-900/30 p-4 rounded-xl border border-stone-200/50 dark:border-stone-800/30 text-center max-w-sm mx-auto shadow-sm backdrop-blur-[1px]">
                      <p className="text-[11px] sm:text-[12px] font-medium text-stone-600 dark:text-stone-300 leading-relaxed italic">
                        "{activeEmotionDetails.centralThought}"
                      </p>
                    </div>

                    {/* Questions Header */}
                    <div className="text-center pt-2 select-none">
                      <p className="text-[10px] uppercase font-extrabold tracking-widest text-purple-600/80">Before the Lord - Questions 1-5</p>
                    </div>

                    {/* Questions List - Center-aligned, clean spaced, matching physical journal */}
                    <div className="space-y-6 text-center max-w-md mx-auto px-2">
                      {activeEmotionDetails.questionsLeft.map((q, idx) => (
                        <p key={idx} className="text-[13px] font-semibold text-stone-800 dark:text-stone-200 leading-relaxed">
                          {q}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Left Page Footer */}
                  <div className="relative pt-8 border-t border-stone-200/40 dark:border-stone-800/40 flex items-end justify-between z-10 gap-4 flex-wrap md:flex-nowrap">
                    {/* Date / Mood / Revisit lines */}
                    <div className="flex flex-wrap items-center gap-2 text-stone-600 dark:text-stone-400 text-[10px] font-bold font-serif-elegant select-none">
                      <span>Date</span>
                      <span className="w-16 border-b border-stone-400/50 h-3" />
                      <span>Mood</span>
                      <span className="w-16 border-b border-stone-400/50 h-3" />
                      <span>Revisit in 3 days</span>
                    </div>

                    {/* Access QR Code block & stacking labels */}
                    <div className="flex items-center gap-3 shrink-0 bg-white/95 dark:bg-stone-900/90 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 shadow-md relative group select-none">
                      <div className="space-y-0.5 text-left leading-none">
                        <p className="text-[8px] font-extrabold uppercase text-stone-400">Access</p>
                        <p className="text-[8px] font-extrabold uppercase text-stone-400">the</p>
                        <p className="text-[11px] font-bold text-stone-850 dark:text-stone-250 font-serif-elegant">Serenity</p>
                        <p className="text-[11px] font-bold text-stone-850 dark:text-stone-250 font-serif-elegant">Scrolls</p>
                        <p className="text-[8px] font-extrabold uppercase text-stone-400">Servant</p>
                      </div>
                      
                      {/* Visual QR Code Mockup grid with outer corner anchors */}
                      <div className="relative">
                        <div className="w-9 h-9 bg-white flex flex-wrap p-0.5 gap-[1px] border border-stone-300 rounded shadow-inner justify-center items-center">
                          {[...Array(25)].map((_, i) => {
                            const isFilled = 
                              // Top-left anchor outline
                              (i === 0 || i === 1 || i === 2 || i === 5 || i === 7 || i === 10 || i === 11 || i === 12) ||
                              // Top-right anchor outline
                              (i === 3 || i === 4 || i === 9) ||
                              // Bottom-left anchor outline
                              (i === 15 || i === 17 || i === 20 || i === 21 || i === 22) ||
                              // Inner random dots
                              (i === 8 || i === 13 || i === 14 || i === 16 || i === 18 || i === 19 || i === 23 || i === 24);
                            
                            return (
                              <div key={i} className={`w-[5px] h-[5px] rounded-[1px] ${
                                isFilled ? 'bg-stone-900' : 'bg-transparent'
                              }`} />
                            );
                          })}
                        </div>
                        
                        {/* Handwriting Here label and curving arrow pointing to the QR code */}
                        <div className="absolute -left-6 -top-11 rotate-[-12deg] z-10 flex flex-col items-center">
                          <span className="font-cursive text-sm font-bold text-purple-600 whitespace-nowrap animate-pulse">*Here*</span>
                          {/* Handdrawn SVG Arrow */}
                          <svg className="w-5 h-5 text-purple-500 transform -rotate-12 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M4 4c6 0 10 3 12 8" />
                            <path d="M11 11l5 1 1-5" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Page 88 number in corner */}
                    <span className="text-[11px] font-extrabold tracking-wider text-stone-400 absolute bottom-0 left-0 select-none">88</span>
                  </div>

                </div>

                {/* 5. Right Page (Questions 6-10 & Closing Prayer/Pledge) */}
                <div className="bg-background dark:bg-stone-950 p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl md:rounded-r-2xl md:rounded-l-none flex flex-col justify-between min-h-[660px] relative overflow-hidden transition-all duration-500 shadow-md">
                  
                  {/* Watercolor Blend background wash */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    <div className="absolute bottom-1/4 right-1/3 w-[150%] h-[150%] translate-x-1/2 translate-y-1/2 bg-gradient-to-bl from-purple-300/15 via-pink-200/20 to-emerald-200/15 dark:from-purple-950/5 dark:via-pink-950/5 dark:to-emerald-950/5 blur-[70px]" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeEmotionDetails.watercolorAccents} transition-all duration-700 opacity-90`} />
                  </div>

                  {/* Soft White Cross Watermark overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-5">
                    {/* Vertical shaft */}
                    <div className="w-20 h-[80%] bg-white rounded-full blur-[3px]" />
                    {/* Horizontal beam */}
                    <div className="absolute w-[75%] h-20 bg-white rounded-full blur-[3px] -translate-y-14" />
                  </div>

                  {/* Dynamic Vertical Margin Stripe matching physical page print */}
                  <div className={`absolute right-0 top-0 bottom-0 w-2.5 z-10 transition-colors duration-500 ${activeEmotionDetails.marginColor}`} />

                  {/* Page content */}
                  <div className="relative space-y-7 z-10">
                    {/* Before the Lord Questions 6-10 header & Notes cursive header */}
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/40 dark:border-stone-800/40">
                      <span className="text-[11px] uppercase tracking-widest font-extrabold text-stone-400 select-none">
                        Before the Lord - Questions 6-10
                      </span>
                      <span className="font-cursive text-3xl text-stone-550 dark:text-stone-400 select-none">Notes</span>
                    </div>

                    {/* Questions List - Center-aligned, clean spaced, matching physical journal */}
                    <div className="space-y-6 text-center max-w-md mx-auto px-2">
                      {activeEmotionDetails.questionsRight.map((q, idx) => (
                        <p key={idx} className="text-[13px] font-semibold text-stone-800 dark:text-stone-200 leading-relaxed">
                          {q}
                        </p>
                      ))}
                    </div>

                    {/* Handwriting Notes section */}
                    <div className="text-center pt-2 select-none">
                      <span className="font-cursive text-4xl text-stone-500/80 dark:text-stone-400/80 tracking-wide select-none">Notes</span>
                    </div>

                    {/* Quiet moment invitation */}
                    <div className="text-center max-w-sm mx-auto">
                      <p className="text-[11px] font-bold text-stone-700 dark:text-stone-300 leading-tight">
                        Take one quiet moment to invite God's peace into my heart.
                      </p>
                    </div>

                    {/* Closing Prayer display */}
                    <div className="bg-purple-500/5 dark:bg-purple-950/10 p-5 rounded-2xl border border-purple-200/20 dark:border-purple-800/10 text-center max-w-md mx-auto shadow-sm backdrop-blur-[1px]">
                      <p className="text-[12.5px] sm:text-[13.5px] font-serif-elegant font-bold text-stone-850 dark:text-stone-100 italic leading-relaxed">
                        "{activeEmotionDetails.closingPrayer}"
                      </p>
                    </div>
                  </div>

                  {/* Right Page Footer */}
                  <div className="relative pt-8 border-t border-stone-200/40 dark:border-stone-800/40 space-y-4 z-10">
                    {/* Pledge line input */}
                    <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 text-xs select-none">
                      <span className="font-bold font-serif-elegant">Pledge:</span>
                      <span className="flex-1 border-b border-dashed border-stone-400 dark:border-stone-600 h-4" />
                    </div>

                    {/* Page 89 number in corner */}
                    <span className="text-[11px] font-extrabold tracking-wider text-stone-400 absolute bottom-0 right-0 select-none">89</span>
                  </div>

                </div>

              </div>

          </div>
        </section>

        {/* Informational Blocks */}
        <section className="grid gap-12 lg:grid-cols-2 items-start mb-24">
          <div className="space-y-8">
            {/* Block 1 */}
            <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Feather className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">Deepen Your emotional reflection</h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                Unlike blank journals that leave you wondering where to start, our structured pages guide you step-by-step. Write out the Scripture, check in with your current feeling, resolve the prompt, and compose a genuine prayer. Designed to cultivate a warm, consistent devotions habit.
              </p>
            </div>

            {/* Block 2 */}
            <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">Immersive KJV scripture beauty</h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                Each page is printed with premium typography presenting timeless verses drawn from the King James Version (KJV). We chose KJV for its incomparable poetic beauty, lyrical rhythms, and historic spiritual depth to help your soul connect more closely to God's presence.
              </p>
            </div>
          </div>

          {/* Right: FAQ Accordions */}
          <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-border/50 pb-4">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Common Questions</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="font-bold text-sm text-left">Do I need the Serenity Scrolls tube to use this?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  No! While they pair together beautifully (drawing a physical scroll and then recording your reflections in the journal), the journal acts as a fully self-contained daily devotional book with all 96 verses printed inside.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="font-bold text-sm text-left">Is the KJV text hard for modern readers?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  We selected accessible, deeply comforting verses where the historical vocabulary is straightforward and poetic, making it very gentle for modern readers while preserving the reverence of the language.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="font-bold text-sm text-left">How does the 30-day AI Servant access work?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  Every journal contains a unique activation code printed on the inside back cover. You can enter this code in the digital Servant portal to instantly unlock 30 days of premium Scripture reflection chats.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="font-bold text-sm text-left">Is this a good gift for other believers?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  Yes, it is one of our most popular gifts! Its premium packaging and high-end cloth finish make it highly meaningful for birthdays, Mother's Day, Easter, small group leaders, or encouraging a friend in a difficult season.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Section: Secondary Conversion Banner */}
        <section className="relative rounded-3xl overflow-hidden border border-purple-200 dark:border-purple-800/40 bg-gradient-to-r from-purple-900 via-purple-950 to-pink-900 text-white p-8 md:p-12 text-center space-y-6">
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
          <div className="relative space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white uppercase tracking-wider">
              ✦ Limited Time Promotion ✦
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold leading-tight">Start Your Scripture Devotion Practice Today</h3>
            <p className="text-white/80 text-sm md:text-base leading-relaxed">
              Order your guided reflection journal now and secure your special launch price along with free shipping and 30 days of free AI companion access.
            </p>
          </div>
          <div className="relative flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto pt-2">
            <Button 
              size="lg" 
              onClick={addToCart} 
              className="w-full sm:w-auto px-8 bg-white hover:bg-stone-100 text-purple-950 font-bold shadow-lg transition-all"
            >
              Order Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReflectionJournal;
