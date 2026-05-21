import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, BookOpen, Calendar, ChevronRight, Clock, Sparkles, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StructuredData } from "@/components/StructuredData";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, buildSeoMetadata } from "@/lib/seo";
import { fetchBlogPostBySlug, fetchRelatedBlogPosts } from "@/lib/content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);

  if (!post) {
    return buildSeoMetadata({
      title: "Blog Post | Serenity Scrolls",
      description: "Browse Serenity Scrolls articles on Bible verses, prayer prompts, and Christian encouragement.",
      path: `/blog/${slug}`,
      noindex: true,
    });
  }

  return buildSeoMetadata({
    title: post.meta_title || `${post.title} | Serenity Scrolls`,
    description: post.meta_description || post.excerpt,
    path: `/blog/${post.slug}`,
    ogTitle: post.meta_title || post.title,
    ogDescription: post.meta_description || post.excerpt,
    image: post.featured_image || "/tube-product-real.png",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await fetchRelatedBlogPosts(post.category, post.id);
  const readingTime = post.word_count ? Math.ceil(post.word_count / 200) : null;
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.featured_image || absoluteUrl("/tube-product-real.png"),
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    keywords: post.seo_keywords?.join(", "),
  };

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <StructuredData data={blogPostingJsonLd} />
      {post.faq_schema?.mainEntity?.length ? <StructuredData data={post.faq_schema} /> : null}

      <Navbar />

      <div className="relative bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-56 h-56 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 max-w-3xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="capitalize text-foreground/70">{post.category}</span>
          </nav>

          <Badge className="capitalize mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-3 py-1">
            {post.category}
          </Badge>

          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-5 tracking-tight">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-medium text-foreground/80">{post.author}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(post.published_at || post.created_at), "MMMM d, yyyy")}
            </span>
            {readingTime ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {readingTime} min read
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-3xl pb-16">
        {post.featured_image ? (
          <div className="mb-10 -mx-4 md:mx-0 rounded-none md:rounded-2xl overflow-hidden shadow-lg">
            <img
              src={post.featured_image}
              alt={post.title}
              width={1200}
              height={675}
              className="w-full h-auto object-cover max-h-[480px]"
            />
          </div>
        ) : null}

        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24">
          <ReactMarkdown
            components={{
              a: ({ href = "", children }) =>
                href.startsWith("/") ? (
                  <Link href={href}>{children}</Link>
                ) : (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {post.faq_schema?.mainEntity?.length ? (
          <section className="mt-14">
            <div className="bg-gradient-to-br from-primary/5 to-amber-500/5 rounded-2xl p-8 border border-primary/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </span>
                Frequently Asked Questions
              </h2>
              <div className="space-y-5">
                {post.faq_schema.mainEntity.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="bg-background/80 rounded-xl p-5 border border-border/40">
                    <h3 className="font-semibold text-base mb-2 text-foreground">{item.name}</h3>
                    <p className="text-foreground/75 text-sm leading-relaxed">{item.acceptedAnswer?.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {post.long_tail_queries?.length ? (
          <section className="mt-10 p-6 bg-muted/30 rounded-2xl border border-border/30">
            <h2 className="text-lg font-semibold mb-4 text-foreground/90">People Also Ask</h2>
            <div className="grid gap-2">
              {post.long_tail_queries.map((query) => (
                <div key={query} className="flex items-start gap-2.5 text-foreground/70 text-sm">
                  <ChevronRight className="h-4 w-4 text-primary/50 shrink-0 mt-0.5" />
                  <span>{query}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {post.seo_keywords?.length ? (
          <div className="mt-10 pt-8 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Topics</p>
            <div className="flex flex-wrap gap-2">
              {post.seo_keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="text-sm px-3.5 py-1.5 bg-muted/60 rounded-full text-muted-foreground border border-border/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <section className="mt-14">
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary/10 via-amber-500/5 to-background">
            <div className="relative p-8 md:p-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-bold mb-2">Continue Your Scripture-Centered Practice</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Shop Serenity Scrolls, explore the Bible verse scrolls guide, or meet the AI Servant for Scripture-based reflection prompts.
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button asChild size="lg" className="group">
                    <Link href="/shop">Shop Serenity Scrolls</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link href="/servant-landing">Explore AI Servant</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {relatedPosts.length ? (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Continue Reading</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className="group">
                  <Card className="overflow-hidden h-full border-border/40 hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5">
                    {relatedPost.featured_image ? (
                      <div className="h-36 overflow-hidden">
                        <img src={relatedPost.featured_image} alt={relatedPost.title} width={480} height={240} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-primary/10 to-amber-500/10 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {relatedPost.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{relatedPost.excerpt}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 text-center">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Blog Posts
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
