import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Gift,
  Heart,
  MessageCircle,
  PenLine,
  Shield,
  Sparkles,
  Sunrise,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { StructuredData } from "@/components/StructuredData";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  serenityProductsJsonLd,
} from "@/lib/seo";
import tubeProduct from "@/assets/tube.jpeg";
import journalProduct from "@/assets/journal.png";
import logo from "@/assets/logo.png";

const emotions = [
  {
    name: "Anxious",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Verses for fear, uncertainty, worry, and overwhelm.",
  },
  {
    name: "Sad",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Verses for grief, loneliness, disappointment, and heavy days.",
  },
  {
    name: "Troubled",
    color: "bg-pink-100 text-pink-800 border-pink-200",
    description: "Verses for spiritual strength, endurance, and hard seasons.",
  },
  {
    name: "Frustrated",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Verses for patience, surrender, forgiveness, and perspective.",
  },
  {
    name: "Grateful",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Verses for thankfulness, worship, and remembering God's goodness.",
  },
  {
    name: "Happy",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Verses for joy, praise, celebration, and sharing encouragement.",
  },
];

const steps = [
  {
    title: "Choose how you feel",
    description: "Pick the color that matches your current emotion.",
  },
  {
    title: "Draw a Scripture scroll",
    description: "Open one scroll and read the verse slowly.",
  },
  {
    title: "Pray and reflect",
    description: "Ask God what He wants to show you through that verse.",
  },
  {
    title: "Write it down",
    description: "Use the Reflection Journal or your own notebook to capture what stands out.",
  },
  {
    title: "Go deeper if needed",
    description: "Use the AI Servant for Scripture-based reflection prompts and faith-centered encouragement.",
  },
];

const audiences = [
  {
    title: "For anxious hearts",
    description: "When worry feels loud and peace feels far away.",
  },
  {
    title: "For grieving or sad seasons",
    description: "When you need comfort, hope, and reminders of God's nearness.",
  },
  {
    title: "For daily quiet time",
    description: "When you want a simple devotional rhythm.",
  },
  {
    title: "For Christian gift giving",
    description: "When you want something more meaningful than another generic gift.",
  },
  {
    title: "For Bible study groups",
    description: "When you want a reflection tool that sparks conversation.",
  },
  {
    title: "For parents and families",
    description: "When you want to help children or loved ones connect emotions with Scripture.",
  },
];

const offers = [
  {
    title: "Reflection Journal",
    bestFor: "Prayer, journaling, emotional reflection, and going deeper with each verse.",
    includes: "Guided prompts for Scripture reflection, gratitude, prayer, and emotional processing.",
    href: "/reflection-journal",
    cta: "Order the Journal",
    image: journalProduct.src,
    alt: "Christian Reflection Journal for prayer and Scripture",
  },
  {
    title: "AI Servant",
    bestFor: "Scripture-based reflection prompts and faith-centered encouragement anytime.",
    includes: "Personalized Bible verse guidance, reflection prompts, and emotional support rooted in Scripture.",
    href: "/servant-landing",
    cta: "Explore AI Servant",
    image: logo.src,
    alt: "AI Servant Scripture-based reflection companion preview",
    disclaimer:
      "The AI Servant is a reflection companion, not a replacement for Scripture, prayer, pastoral care, counseling, medical care, or emergency help.",
  },
  {
    title: "Serenity Scrolls",
    bestFor: "Daily Scripture encouragement and meaningful Christian gifting.",
    includes: "96 color-coded Bible verse scrolls organized by emotion.",
    href: "/shop",
    cta: "Shop Serenity Scrolls",
    image: tubeProduct.src,
    alt: "Serenity Scrolls Bible verse scrolls in keepsake tube",
  },
];

const testimonials = [
  {
    name: "Melinda G.",
    label: "Verified Purchase",
    useCase: "Bible class and gift giving",
    text:
      "Beyond my expectations. It is like your own personal devotional in a can, and I can see using this for a study group, Bible class, or as a gift for someone who needs encouragement.",
  },
  {
    name: "Pam Ward",
    label: "Verified Purchase",
    useCase: "Grief and comfort",
    text:
      "The serenity scrolls help me fill up my heart with scripture. They make it easy for me to reach out and touch God's word and receive God's blessings.",
  },
  {
    name: "Kevin Sutton",
    label: "Verified Purchase",
    useCase: "Daily encouragement",
    text:
      "Very high quality and convenient to use when I need words of wisdom. An excellent gift for family and close friends going through daily troubles.",
  },
];

const useCases = [
  {
    title: "Morning quiet time",
    description: "Pull one scroll before starting the day.",
    icon: Sunrise,
  },
  {
    title: "Prayer journaling",
    description: "Write the verse, your prayer, and what God is teaching you.",
    icon: PenLine,
  },
  {
    title: "Anxiety reset",
    description: "Use the Anxious category when worry begins to spiral.",
    icon: Heart,
  },
  {
    title: "Gratitude practice",
    description: "Use the Grateful category to slow down and remember God's goodness.",
    icon: Sparkles,
  },
  {
    title: "Family devotion",
    description: "Let each family member draw a scroll and share what stands out.",
    icon: Users,
  },
  {
    title: "Christian gifting",
    description: "Give it for birthdays, sympathy, encouragement, Christmas, Mother's Day, Easter, or Bible study groups.",
    icon: Gift,
  },
];

const faqs = [
  {
    question: "What are Serenity Scrolls?",
    answer:
      "Serenity Scrolls are 96 color-coded Bible verse scrolls organized by emotion. Each scroll helps you find Scripture for moments of anxiety, sadness, frustration, gratitude, joy, or spiritual trouble.",
  },
  {
    question: "How do Serenity Scrolls help with anxiety?",
    answer:
      "Serenity Scrolls help anxious hearts by making it simple to pause, choose an emotion, read Scripture, and reflect through prayer. They are not medical treatment, but they can support a faith-based routine for peace and encouragement.",
  },
  {
    question: "Is Serenity Scrolls a good Christian gift?",
    answer:
      "Yes. Serenity Scrolls makes a meaningful Christian gift for people who enjoy Bible verses, devotionals, prayer journaling, encouragement gifts, Bible study, or faith-based emotional support.",
  },
  {
    question: "How do I use Serenity Scrolls during quiet time?",
    answer:
      "Choose the emotion that matches how you feel, draw a scroll, read the verse slowly, pray over it, and write a short reflection in a journal or notebook.",
  },
  {
    question: "Does Serenity Scrolls replace reading the Bible?",
    answer:
      "No. Serenity Scrolls is designed to point you back to God's Word. It is a devotional companion, not a replacement for full Bible reading, prayer, church community, or pastoral guidance.",
  },
  {
    question: "What is the Serenity Scrolls Reflection Journal?",
    answer:
      "The Reflection Journal is a guided Christian journal designed to help you pray, reflect on Scripture, process emotions, practice gratitude, and go deeper with each Serenity Scrolls verse.",
  },
  {
    question: "What is the AI Servant?",
    answer:
      "The AI Servant is a Scripture-based reflection companion that offers Bible verses, devotional prompts, and faith-centered encouragement based on what you are feeling or walking through.",
  },
  {
    question: "Is the AI Servant a pastor, counselor, or spiritual authority?",
    answer:
      "No. The AI Servant is not a pastor, counselor, doctor, or emergency resource. It is a reflection tool that points users back to Scripture and should not replace pastoral care, professional counseling, medical care, or crisis support.",
  },
];

export default function BibleVerseScrollsForAnxietyAndPeacePage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          {
            name: "Bible Verse Scrolls for Anxiety and Peace",
            path: "/bible-verse-scrolls-for-anxiety-and-peace",
          },
        ])}
      />
      <StructuredData data={faqPageJsonLd(faqs)} />
      {serenityProductsJsonLd.map((product) => (
        <StructuredData key={product.name} data={product} />
      ))}

      <Navbar />

      <main>
        <section className="relative overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
          <div className="relative container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div className="max-w-3xl">
                <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary mb-6">
                  Bible verse scrolls for anxiety and peace
                </p>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                  Bible Verse Scrolls for Anxiety, Peace, Gratitude & Daily Encouragement
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                  Serenity Scrolls gives you 96 color-coded Scripture verses organized by emotion, so you can reach for God's Word exactly when your heart needs it.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Button size="lg" className="h-14 px-8 text-lg" asChild>
                    <Link href="/shop">
                      Shop Serenity Scrolls
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                    <a href="#how-it-works">See How It Works</a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  A meaningful Christian gift and daily devotional tool for emotional peace, prayer, and Scripture reflection.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-200/50 via-white/60 to-purple-200/40 blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-4 shadow-2xl">
                  <img
                    src={tubeProduct.src}
                    alt="Color-coded Scripture scrolls for anxiety, gratitude, sadness, joy, frustration, and troubled moments"
                    width={900}
                    height={700}
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                  <div className="grid grid-cols-3 gap-2 pt-4">
                    {emotions.slice(0, 6).map((emotion) => (
                      <span key={emotion.name} className={`rounded-full border px-3 py-1 text-center text-xs font-semibold ${emotion.color}`}>
                        {emotion.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-5">
              When Life Gets Loud, Finding the Right Verse Shouldn't Be Hard
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                Some days you feel anxious. Some days you feel grateful. Some days you feel sad, frustrated, joyful, or spiritually troubled, and you may not know where to turn in Scripture first.
              </p>
              <p>
                Serenity Scrolls makes that moment simple. Choose the color that matches your emotion, draw a scroll, read the Bible verse, and let God's Word meet you right where you are.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                96 Scripture Scrolls. 6 Emotions. One Simple Daily Faith Practice.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Serenity Scrolls is a Scripture-based devotional tool with 96 Bible verse scrolls organized into six emotional categories: Anxious, Sad, Troubled, Frustrated, Grateful, and Happy. Each scroll helps you pause, pray, reflect, and reconnect with God's Word in the middle of real life.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {emotions.map((emotion) => (
                <div key={emotion.name} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold mb-4 ${emotion.color}`}>
                    {emotion.name}
                  </span>
                  <p className="text-muted-foreground">{emotion.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-5">What Comes With Serenity Scrolls?</h2>
                <ul className="space-y-4 text-foreground/80">
                  {[
                    "96 hand-selected Bible verse scrolls",
                    "6 color-coded emotional categories",
                    "Beautiful keepsake tube",
                    "Easy daily devotional practice",
                    "Designed for prayer, journaling, gifting, Bible study, and quiet time",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <img
                  src={tubeProduct.src}
                  alt="Serenity Scrolls Bible verse scrolls in keepsake tube"
                  width={600}
                  height={600}
                  loading="lazy"
                  className="rounded-2xl border border-border bg-card object-cover aspect-square shadow-sm"
                />
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-center">
                  <BookOpen className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-3">A Bible Verse Jar Alternative</h3>
                  <p className="text-muted-foreground">
                    Instead of loose slips of paper, Serenity Scrolls gives you a premium keepsake tube and emotion-based categories that make Scripture easy to find.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-muted/30 scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                A Simple Way to Meet Each Emotion With Scripture
              </h2>
              <p className="text-lg text-muted-foreground">
                Keep it beside your Bible, on your desk, near your prayer chair, or anywhere you want a quick path back to God's Word.
              </p>
            </div>
            <div className="grid md:grid-cols-5 gap-5">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Made for the Moments When Your Heart Needs Scripture
              </h2>
              <p className="text-lg text-muted-foreground">
                Serenity Scrolls supports faith-based emotional wellness by making Scripture easy to reach, remember, pray through, and share.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {audiences.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <Heart className="h-6 w-6 text-primary mb-3" />
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Choose Your Serenity Scrolls Experience
              </h2>
              <p className="text-lg text-muted-foreground">
                Begin with the physical scrolls, then deepen the rhythm with journaling and Scripture-based reflection support.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <div key={offer.title} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                  <img
                    src={offer.image}
                    alt={offer.alt}
                    width={640}
                    height={480}
                    loading="lazy"
                    className="h-56 w-full object-cover bg-muted"
                  />
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold mb-3">{offer.title}</h3>
                    <p className="text-sm font-semibold text-foreground mb-1">Best for:</p>
                    <p className="text-muted-foreground mb-4">{offer.bestFor}</p>
                    <p className="text-sm font-semibold text-foreground mb-1">Includes:</p>
                    <p className="text-muted-foreground mb-5">{offer.includes}</p>
                    {offer.disclaimer && (
                      <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 mb-5">
                        {offer.disclaimer}
                      </p>
                    )}
                    <Button className="mt-auto" asChild>
                      <Link href={offer.href}>{offer.cta}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Real Encouragement From Real Customers</h2>
              <p className="text-lg text-muted-foreground">
                These customer comments are drawn from existing Serenity Scrolls testimonials in the project.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-foreground/80 leading-relaxed mb-5">"{testimonial.text}"</p>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.label}</p>
                  <p className="text-xs text-primary mt-2">{testimonial.useCase}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ways to Use Serenity Scrolls</h2>
              <p className="text-lg text-muted-foreground">
                Use it alone, with your journal, around the table, or as a Christian devotional gift for someone who needs encouragement.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {useCases.map((useCase) => (
                <div key={useCase.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <useCase.icon className="h-7 w-7 text-primary mb-3" />
                  <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-muted-foreground">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions About Serenity Scrolls</h2>
              <p className="text-lg text-muted-foreground">
                Helpful answers for shoppers, gift givers, journalers, and anyone looking for Scripture for emotional peace.
              </p>
            </div>
            <div className="space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-[var(--gradient-peaceful)]">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Shield className="h-10 w-10 text-primary mx-auto mb-5" />
              <h2 className="text-3xl md:text-4xl font-bold mb-5">Find the Verse Your Heart Needs Today</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Whether you feel anxious, grateful, sad, joyful, frustrated, or troubled, Serenity Scrolls helps you pause and meet the moment with Scripture.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link href="/shop">Shop Serenity Scrolls</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                  <Link href="/reflection-journal">Order the Reflection Journal</Link>
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/servant-landing" className="text-primary font-medium hover:underline">
                  Explore the AI Scripture companion
                </Link>
                <Link href="/blog" className="text-primary font-medium hover:underline">
                  Read Bible verses and prayer prompts
                </Link>
                <Link href="/contact" className="text-primary font-medium hover:underline">
                  Contact Serenity Scrolls
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
