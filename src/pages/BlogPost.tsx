import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User, BookOpen } from "lucide-react";
import { Helmet } from "react-helmet";

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

  // Generate JSON-LD structured data
  const generateStructuredData = () => {
    if (!post) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.meta_description || post.excerpt,
      "image": post.featured_image || undefined,
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "Serenity Scrolls",
        "logo": {
          "@type": "ImageObject",
          "url": "https://serenityscrollsservant.lovable.app/logo.png"
        }
      },
      "datePublished": post.published_at || post.created_at,
      "dateModified": post.updated_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://serenityscrollsservant.lovable.app/blog/${post.slug}`
      },
      "keywords": post.seo_keywords?.join(", ")
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-20 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
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
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  // Simple markdown-like rendering for content
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-xl font-semibold mt-8 mb-4">{line.slice(4)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold mt-10 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-3xl font-bold mt-10 mb-4">{line.slice(2)}</h1>;
      }
      // Blockquotes (for Scripture)
      if (line.startsWith("> ")) {
        return (
          <blockquote key={i} className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
            {line.slice(2)}
          </blockquote>
        );
      }
      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="ml-6 list-disc">
            {line.slice(2)}
          </li>
        );
      }
      // Bold text handling
      const boldPattern = /\*\*(.*?)\*\*/g;
      if (boldPattern.test(line)) {
        const parts = line.split(boldPattern);
        return (
          <p key={i} className="mb-4">
            {parts.map((part, j) => 
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      }
      // Empty lines
      if (line.trim() === "") {
        return <br key={i} />;
      }
      // Regular paragraphs
      return <p key={i} className="mb-4 leading-relaxed">{line}</p>;
    });
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
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Article Header */}
        <article>
          <header className="mb-8">
            <Badge variant="secondary" className="capitalize mb-4">
              {post.category}
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {post.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at || post.created_at), "MMMM d, yyyy")}
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-10 rounded-lg overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Related Questions (AEO) */}
          {post.long_tail_queries && post.long_tail_queries.length > 0 && (
            <section className="mt-12 p-6 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Related Questions</h3>
              <ul className="space-y-2">
                {post.long_tail_queries.map((query, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {query}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Keywords */}
          {post.seo_keywords && post.seo_keywords.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.seo_keywords.map((keyword) => (
                <span 
                  key={keyword} 
                  className="text-sm px-3 py-1 bg-muted rounded-full text-muted-foreground"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* CTA Section */}
        <section className="mt-16 p-8 bg-muted/50 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">
            Need Personalized Scripture Guidance?
          </h2>
          <p className="text-muted-foreground mb-6">
            Our Serenity Scrolls Servant can help you find the perfect Scripture 
            for whatever emotion you're experiencing today.
          </p>
          <Button asChild size="lg">
            <Link to="/servant-access">
              Talk to the Servant
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default BlogPostPage;
