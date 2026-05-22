"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BookOpen, Calendar, Gift, Heart, PenLine, Sparkles, User } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  featured_image: string | null;
  seo_keywords: string[] | null;
  created_at: string;
  published_at: string | null;
}

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, category, author, featured_image, seo_keywords, created_at, published_at")
        .or("status.eq.published,and(status.is.null,published.eq.true)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const categoryCards = [
    {
      title: "Bible Verses by Emotion",
      description:
        "Find Scripture for anxiety, gratitude, grief, sadness, frustration, joy, and troubled seasons.",
      href: "/bible-verse-scrolls-for-anxiety-and-peace",
      icon: Heart,
    },
    {
      title: "Prayer & Reflection",
      description:
        "Use gentle prayer prompts to slow down, listen, surrender, and bring your honest emotions to God.",
      href: "/blog",
      icon: Sparkles,
    },
    {
      title: "Christian Journaling",
      description:
        "Explore guided reflection ideas that turn a Bible verse into gratitude, confession, hope, and growth.",
      href: "/reflection-journal",
      icon: PenLine,
    },
    {
      title: "Christian Gifts",
      description:
        "Discover thoughtful Scripture gifts for encouragement, sympathy, birthdays, holidays, and Bible study groups.",
      href: "/shop",
      icon: Gift,
    },
    {
      title: "AI + Scripture Guidance",
      description:
        "Learn how the AI Servant supports Scripture-based reflection without replacing prayer, church, or pastoral care.",
      href: "/servant-landing",
      icon: Sparkles,
    },
    {
      title: "Daily Encouragement",
      description:
        "Build a simple rhythm of Bible reading, prayer, journaling, and small faithful steps for ordinary days.",
      href: "/shop",
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bible Verses, Prayer Prompts & Christian Encouragement
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The Serenity Scrolls Blog helps you find Scripture-centered encouragement for real emotional moments. Whether you are looking for Bible verses for anxiety, gratitude reflections, prayer prompts for grief, Christian journaling ideas, or peaceful devotional habits, this space is designed to point your heart back to God's Word with clarity and care.
          </p>
        </div>

        <section className="mb-16 max-w-5xl mx-auto">
          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] items-start mb-10">
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                Some visitors come here feeling anxious and need a verse to steady their breathing. Others are preparing a small group lesson, searching for Christian gifts for encouragement, or trying to begin a prayer journal for the first time. However you arrived, the aim is simple: help you connect emotions with Scripture in a way that feels peaceful, honest, and faithful.
              </p>
              <p>
                You will find articles on Bible verses by emotion, daily Scripture reflection, prayer and journaling rhythms, meaningful Christian gifting, and how tools like the <Link href="/servant-landing" className="text-primary font-medium hover:underline">AI Scripture companion</Link> can support reflection while keeping Scripture, prayer, and wise human care in their proper place. For a practical starting point, explore our <Link href="/bible-verse-scrolls-for-anxiety-and-peace" className="text-primary font-medium hover:underline">Bible verse scrolls for anxiety and peace</Link>, browse the <Link href="/shop" className="text-primary font-medium hover:underline">shop for Christian Scripture gifts</Link>, or learn how the <Link href="/reflection-journal" className="text-primary font-medium hover:underline">Christian Reflection Journal</Link> helps you go deeper with each verse.
              </p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-6">
              <h2 className="text-xl font-semibold mb-3">Start Here</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="/shop" className="font-medium text-foreground hover:text-primary transition-colors">
                    Shop Christian Scripture gifts for daily encouragement
                  </Link>
                </li>
                <li>
                  <Link href="/reflection-journal" className="font-medium text-foreground hover:text-primary transition-colors">
                    Order the Christian Reflection Journal
                  </Link>
                </li>
                <li>
                  <Link href="/servant-landing" className="font-medium text-foreground hover:text-primary transition-colors">
                    Explore the AI Scripture companion
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryCards.map((category) => (
              <Link key={category.title} href={category.href} className="group">
                <div className="h-full rounded-xl border border-border bg-card p-5 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-primary/30">
                  <category.icon className="h-6 w-6 text-primary mb-3" />
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{category.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Blog Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Posts Yet</h2>
            <p className="text-muted-foreground">
              We're working on creating meaningful content for you. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts?.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300 group">
                  {post.featured_image ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {post.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    
                    {/* Keywords */}
                    {post.seo_keywords && post.seo_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.seo_keywords.slice(0, 3).map((keyword) => (
                          <span 
                            key={keyword} 
                            className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(post.published_at || post.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Looking for Personal Guidance?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Our Serenity Scrolls Servant is here to help you find the right Scripture 
            for your emotional journey.
          </p>
          <Link
            href="/servant-access"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Meet the Servant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Blog;
