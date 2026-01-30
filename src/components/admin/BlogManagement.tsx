import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Sparkles, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { BlogPostForm } from "./BlogPostForm";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  published: boolean;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string[] | null;
  long_tail_queries: string[] | null;
  status: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  published: boolean;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  seo_keywords: string[];
  long_tail_queries: string[];
  status: string;
  published_at: string | null;
}

const initialFormData: BlogFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "faith",
  author: "Serenity Scrolls Team",
  published: false,
  featured_image: "",
  meta_title: "",
  meta_description: "",
  seo_keywords: [],
  long_tail_queries: [],
  status: "draft",
  published_at: null,
};

export const BlogManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [generateTopic, setGenerateTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      const { error } = await supabase.from("blog_posts").insert([{
        ...data,
        seo_keywords: data.seo_keywords,
        long_tail_queries: data.long_tail_queries,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Blog post created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Failed to create post", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BlogFormData }) => {
      const { error } = await supabase.from("blog_posts").update({
        ...data,
        seo_keywords: data.seo_keywords,
        long_tail_queries: data.long_tail_queries,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Blog post updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Failed to update post", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Blog post deleted successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Failed to delete post", description: error.message });
    },
  });

  const generateBlog = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-blog", {
        body: { 
          topic: generateTopic || undefined,
          additionalContext: additionalContext || undefined,
        },
      });

      if (response.error) throw response.error;

      const generated = response.data;
      setFormData({
        ...initialFormData,
        title: generated.title || "",
        slug: generated.slug || "",
        excerpt: generated.excerpt || "",
        content: generated.content || "",
        category: generated.category || "faith",
        meta_title: generated.meta_title || "",
        meta_description: generated.meta_description || "",
        seo_keywords: generated.seo_keywords || generated.seoKeywords || [],
        long_tail_queries: generated.long_tail_queries || generated.longTailQueries || [],
        status: "draft",
        published: false,
        published_at: null,
      });
      setIsDialogOpen(true);
      toast({ title: "Blog generated!", description: "Review and edit before publishing." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Generation failed", description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingPost(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author: post.author,
      published: post.published,
      featured_image: post.featured_image || "",
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      seo_keywords: post.seo_keywords || [],
      long_tail_queries: post.long_tail_queries || [],
      status: post.status || (post.published ? "published" : "draft"),
      published_at: post.published_at,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getPostStatus = (post: BlogPost) => {
    const status = post.status || (post.published ? "published" : "draft");
    return status;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Blog Posts</CardTitle>
            <Button onClick={() => { setEditingPost(null); setFormData(initialFormData); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
          
          {/* AI Generator Section */}
          <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter a topic (e.g., 'finding joy in difficult times', 'dealing with anxiety through faith')..."
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <Button onClick={generateBlog} disabled={isGenerating} variant="outline" className="shrink-0">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate with AI
              </Button>
            </div>
            <Textarea
              placeholder="Additional context (optional): target audience, specific Scripture to include, tone preferences..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              disabled={isGenerating}
              rows={2}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              AI generates AEO-optimized content with question-style headings, SEO keywords, and long-tail queries.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No blog posts yet. Create your first post or generate one with AI!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts?.map((post) => {
                  const status = getPostStatus(post);
                  return (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                      <TableCell className="capitalize">{post.category}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {status === "published" ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        {post.seo_keywords && post.seo_keywords.length > 0 ? (
                          <span className="text-xs text-muted-foreground truncate block">
                            {post.seo_keywords.slice(0, 2).join(", ")}
                            {post.seo_keywords.length > 2 && ` +${post.seo_keywords.length - 2}`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(post.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" asChild>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(post)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this post?")) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
          </DialogHeader>
          <BlogPostForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingPost}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
