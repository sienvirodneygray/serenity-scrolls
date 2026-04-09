import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BookOpen, Calendar, User } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Faith & Reflection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover Scripture-based insights to guide your emotional journey. 
            Let God's Word illuminate your path through every season of life.
          </p>
        </div>

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
