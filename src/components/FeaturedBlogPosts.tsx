import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BookOpen, ArrowRight, Calendar } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featured_image: string | null;
  created_at: string;
}

export const FeaturedBlogPosts = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["featured-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, category, featured_image, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Don't render anything if no posts
  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Faith & Reflection</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scripture-based insights to guide your emotional and spiritual journey
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {posts?.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300 group">
                  {post.featured_image ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary/50" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {post.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.created_at), "MMM d")}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link to="/blog">
              View All Posts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
