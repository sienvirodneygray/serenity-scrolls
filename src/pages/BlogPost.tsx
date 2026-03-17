import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User, BookOpen, Clock, ChevronRight, Sparkles, Share2, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet";
import { WEBSITE_AMAZON_URL } from "@/lib/amazonAttribution";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string[] | null;
  long_tail_queries: string[] | null;
  faq_schema: any;
  word_count: number | null;
  created_at: string;
  published_at: string | null;
  updated_at: string;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .or("status.eq.published,and(status.is.null,published.eq.true)")
        .maybeSingle();

      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.category, post?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image, category, published_at, created_at")
        .or("status.eq.published,and(status.is.null,published.eq.true)")
        .eq("category", post!.category)
        .neq("id", post!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!post,
  });

  const generateStructuredData = () => {
    if (!post) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.featured_image || undefined,
      author: { "@type": "Person", name: post.author },
      publisher: {
        "@type": "Organization",
        name: "Serenity Scrolls",
        logo: { "@type": "ImageObject", url: "https://serenityscrollsservant.lovable.app/logo.png" },
      },
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://serenityscrollsservant.lovable.app/blog/${post.slug}`,
      },
      keywords: post.seo_keywords?.join(", "),
    };
  };

  const readingTime = post?.word_count ? Math.ceil(post.word_count / 200) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-20 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-80 w-full rounded-2xl mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150" />
            <BookOpen className="relative h-16 w-16 text-primary/60" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to Blog</Link>
          </Button>
        </main>
      </div>
    );
  }

  // Enhanced markdown rendering with links, lists, horizontal rules, TOC anchors
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let inList = false;
    let listItems: JSX.Element[] = [];
    let listType: "ul" | "ol" = "ul";

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === "ol") {
          elements.push(<ol key={`list-${elements.length}`} className="space-y-2 mb-6 ml-6 list-decimal marker:text-primary/60 marker:font-semibold">{listItems}</ol>);
        } else {
          elements.push(<ul key={`list-${elements.length}`} className="space-y-2 mb-6 ml-6 list-disc marker:text-primary/40">{listItems}</ul>);
        }
        listItems = [];
        inList = false;
      }
    };

    const renderInline = (text: string) => {
      // bold, italic, links, inline code
      const parts: (string | JSX.Element)[] = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Links: [text](url)
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        // Bold: **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Italic: *text* or _text_
        const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);
        // Inline code: `text`
        const codeMatch = remaining.match(/`([^`]+)`/);

        // Find the earliest match
        const matches = [
          linkMatch && { type: "link", match: linkMatch, index: linkMatch.index! },
          boldMatch && { type: "bold", match: boldMatch, index: boldMatch.index! },
          italicMatch && { type: "italic", match: italicMatch, index: italicMatch.index! },
          codeMatch && { type: "code", match: codeMatch, index: codeMatch.index! },
        ].filter(Boolean).sort((a, b) => a!.index - b!.index);

        if (matches.length === 0) {
          parts.push(remaining);
          break;
        }

        const earliest = matches[0]!;
        if (earliest.index > 0) {
          parts.push(remaining.slice(0, earliest.index));
        }

        if (earliest.type === "link") {
          const [full, linkText, url] = earliest.match;
          const isInternal = url.startsWith("/") || url.includes("serenityscrollsservant");
          parts.push(
            isInternal ? (
              <Link key={key++} to={url} className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60 transition-colors font-medium">{linkText}</Link>
            ) : (
              <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60 transition-colors font-medium">{linkText}</a>
            )
          );
          remaining = remaining.slice(earliest.index + full.length);
        } else if (earliest.type === "bold") {
          parts.push(<strong key={key++} className="font-semibold text-foreground">{earliest.match[1]}</strong>);
          remaining = remaining.slice(earliest.index + earliest.match[0].length);
        } else if (earliest.type === "italic") {
          parts.push(<em key={key++} className="italic text-foreground/90">{earliest.match[1] || earliest.match[2]}</em>);
          remaining = remaining.slice(earliest.index + earliest.match[0].length);
        } else if (earliest.type === "code") {
          parts.push(<code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{earliest.match[1]}</code>);
          remaining = remaining.slice(earliest.index + earliest.match[0].length);
        }
      }

      return parts;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Horizontal rule
      if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
        flushList();
        elements.push(<hr key={`hr-${i}`} className="my-10 border-t border-border/60" />);
        continue;
      }

      // Headers with anchor IDs
      if (line.startsWith("#### ")) {
        flushList();
        const text = line.slice(5);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        elements.push(<h4 key={i} id={id} className="text-lg font-semibold mt-8 mb-3 text-foreground/90 scroll-mt-24">{renderInline(text)}</h4>);
        continue;
      }
      if (line.startsWith("### ")) {
        flushList();
        const text = line.slice(4);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        elements.push(<h3 key={i} id={id} className="text-xl font-bold mt-10 mb-4 text-foreground scroll-mt-24">{renderInline(text)}</h3>);
        continue;
      }
      if (line.startsWith("## ")) {
        flushList();
        const text = line.slice(3);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        elements.push(
          <h2 key={i} id={id} className="text-2xl md:text-3xl font-bold mt-14 mb-5 text-foreground scroll-mt-24 relative">
            <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/20 rounded-full hidden md:block" />
            {renderInline(text)}
          </h2>
        );
        continue;
      }
      if (line.startsWith("# ")) {
        flushList();
        elements.push(<h1 key={i} className="text-3xl md:text-4xl font-bold mt-12 mb-5 text-foreground scroll-mt-24">{renderInline(line.slice(2))}</h1>);
        continue;
      }

      // Blockquotes (Scripture)
      if (line.startsWith("> ")) {
        flushList();
        const quoteText = line.slice(2);
        // Check if next lines are also blockquotes
        let fullQuote = quoteText;
        while (i + 1 < lines.length && lines[i + 1].startsWith("> ")) {
          i++;
          fullQuote += "\n" + lines[i].slice(2);
        }
        elements.push(
          <blockquote key={i} className="my-6 border-l-4 border-primary/60 bg-primary/5 dark:bg-primary/10 rounded-r-xl px-5 py-4 relative overflow-hidden">
            <div className="absolute top-2 right-3 text-primary/10 text-6xl font-serif leading-none select-none">"</div>
            <p className="relative text-foreground/80 italic leading-relaxed text-base">{renderInline(fullQuote)}</p>
          </blockquote>
        );
        continue;
      }

      // Numbered lists
      const olMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (olMatch) {
        if (!inList || listType !== "ol") {
          flushList();
          inList = true;
          listType = "ol";
        }
        listItems.push(<li key={i} className="text-foreground/85 leading-relaxed pl-1">{renderInline(olMatch[2])}</li>);
        continue;
      }

      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!inList || listType !== "ul") {
          flushList();
          inList = true;
          listType = "ul";
        }
        listItems.push(<li key={i} className="text-foreground/85 leading-relaxed pl-1">{renderInline(line.slice(2))}</li>);
        continue;
      }

      flushList();

      // Empty lines
      if (line.trim() === "") {
        continue;
      }

      // Regular paragraphs
      elements.push(
        <p key={i} className="mb-5 text-foreground/85 leading-[1.8] text-[16.5px]">
          {renderInline(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post.title, text: post.excerpt, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        {post.seo_keywords && <meta name="keywords" content={post.seo_keywords.join(", ")} />}
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://serenityscrollsservant.lovable.app/blog/${post.slug}`} />
        <script type="application/ld+json">{JSON.stringify(generateStructuredData())}</script>
        {post.faq_schema && <script type="application/ld+json">{JSON.stringify(post.faq_schema)}</script>}
      </Helmet>

      <Navbar />

      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-56 h-56 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 max-w-3xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="capitalize text-foreground/70">{post.category}</span>
          </nav>

          {/* Category Badge */}
          <Badge className="capitalize mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-3 py-1">
            {post.category}
          </Badge>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-5 tracking-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
            {post.excerpt}
          </p>

          {/* Meta Info Bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-medium text-foreground/80">{post.author}</span>
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(post.published_at || post.created_at), "MMMM d, yyyy")}
            </span>
            {readingTime && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime} min read
                </span>
              </>
            )}
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-3xl pb-16">
        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-10 -mx-4 md:mx-0 rounded-none md:rounded-2xl overflow-hidden shadow-lg">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto object-cover max-h-[480px]"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="relative">
          <div className="prose-custom">
            {renderContent(post.content)}
          </div>
        </article>

        {/* FAQ Section (styled from faq_schema) */}
        {post.faq_schema?.mainEntity && post.faq_schema.mainEntity.length > 0 && (
          <section className="mt-14">
            <div className="bg-gradient-to-br from-primary/5 to-amber-500/5 rounded-2xl p-8 border border-primary/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </span>
                Frequently Asked Questions
              </h2>
              <div className="space-y-5">
                {post.faq_schema.mainEntity.map((item: any, i: number) => (
                  <div key={i} className="bg-background/80 backdrop-blur-sm rounded-xl p-5 border border-border/40 hover:border-primary/20 transition-colors">
                    <h3 className="font-semibold text-base mb-2 text-foreground">{item.name}</h3>
                    <p className="text-foreground/75 text-sm leading-relaxed">{item.acceptedAnswer?.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related Questions (AEO) */}
        {post.long_tail_queries && post.long_tail_queries.length > 0 && (
          <section className="mt-10 p-6 bg-muted/30 rounded-2xl border border-border/30">
            <h3 className="text-lg font-semibold mb-4 text-foreground/90">People Also Ask</h3>
            <div className="grid gap-2">
              {post.long_tail_queries.map((query, i) => (
                <div key={i} className="flex items-start gap-2.5 text-foreground/70 text-sm">
                  <ChevronRight className="h-4 w-4 text-primary/50 shrink-0 mt-0.5" />
                  <span>{query}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Keywords Tags */}
        {post.seo_keywords && post.seo_keywords.length > 0 && (
          <div className="mt-10 pt-8 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Topics</p>
            <div className="flex flex-wrap gap-2">
              {post.seo_keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="text-sm px-3.5 py-1.5 bg-muted/60 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-default border border-border/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Servant CTA Card */}
        <section className="mt-14">
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary/10 via-amber-500/5 to-background">
            <div className="relative p-8 md:p-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-bold mb-2">Need Personalized Scripture Guidance?</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    The Serenity Scrolls Servant uses AI to match you with the perfect Scripture for whatever you're feeling right now.
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button asChild size="lg" className="group">
                    <Link to="/servant-access">
                      Talk to Servant
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <a href={WEBSITE_AMAZON_URL} target="_blank" rel="noopener noreferrer">
                      Get Serenity Scrolls
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Continue Reading</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((rp: any) => (
                <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                  <Card className="overflow-hidden h-full border-border/40 hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5">
                    {rp.featured_image ? (
                      <div className="h-36 overflow-hidden">
                        <img src={rp.featured_image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-primary/10 to-amber-500/10 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rp.excerpt}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Button variant="outline" asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Blog Posts
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BlogPostPage;
