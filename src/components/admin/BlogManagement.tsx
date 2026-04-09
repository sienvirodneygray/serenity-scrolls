import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Sparkles, Eye, Loader2, Play, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogPostForm } from "./BlogPostForm";
import { SEOSettings } from "./SEOSettings";
import { TopicBacklogManager } from "./TopicBacklogManager";
import { ClusterManager } from "./ClusterManager";
import { EditorialCalendar } from "./EditorialCalendar";
import { PublishLogs } from "./PublishLogs";

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
  const [seoGeneratedPost, setSeoGeneratedPost] = useState<any>(null);
  const [seoValidationResult, setSeoValidationResult] = useState<any>(null);
  const [seoManualTopic, setSeoManualTopic] = useState("");
  const [seoAdditionalContext, setSeoAdditionalContext] = useState("");

  const seoGenerateMutation = useMutation({
    mutationFn: async (opts: { topic?: string; action: string }) => {
      const { data, error } = await supabase.functions.invoke("seo-engine-generate", {
        body: { action: opts.action, topic: opts.topic || undefined },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setSeoGeneratedPost(data);
      toast({ title: data.saved ? "Post generated & saved!" : "Post generated (preview)" });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: (err) => toast({ variant: "destructive", title: "Generation failed", description: err.message }),
  });

  const seoValidateMutation = useMutation({
    mutationFn: async (postData: any) => {
      const { data, error } = await supabase.functions.invoke("seo-engine-validate", { body: { postData } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSeoValidationResult(data);
      toast({ title: data.valid ? "✅ Quality check passed!" : "Quality issues found", variant: data.valid ? "default" : "destructive", description: data.issues?.join("; ") });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-engine-scheduler", { body: { action: "refresh-old-post" } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => toast({ title: data.message || "Post refreshed" }),
    onError: (err) => toast({ variant: "destructive", title: "Refresh failed", description: err.message }),
  });

  const triggerPublishMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-engine-scheduler", { body: { action: "check-schedule" } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Schedule checked" });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: (err) => toast({ variant: "destructive", title: "Publish failed", description: err.message }),
  });
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
      } as any).eq("id", id);
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
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="generate">SEO Generate</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-row items-center justify-between">
                <CardTitle>Website SEAL Generator</CardTitle>
                <Button onClick={() => { setEditingPost(null); setFormData(initialFormData); setIsDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New SEAL
                </Button>
              </div>
              
              <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter a topic (e.g., 'finding joy in difficult times')..."
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <Button onClick={generateBlog} disabled={isGenerating} variant="outline" className="shrink-0">
                    {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Generate SEAL with AI
                  </Button>
                </div>
                <Textarea
                  placeholder="Additional context (optional)..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  disabled={isGenerating}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : posts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No SEAL content yet. Create your first post or generate one with AI!
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
                            <span className={`px-2 py-1 rounded-full text-xs ${status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}`}>
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
                              <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this post?")) deleteMutation.mutate(post.id); }}>
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
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => triggerPublishMutation.mutate()} disabled={triggerPublishMutation.isPending}>
                {triggerPublishMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Force Publish Now
              </Button>
              <Button variant="outline" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
                {refreshMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Refresh Old Post
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Generate SEO Post</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topic (leave empty for auto-selection from backlog)</Label>
                <Input value={seoManualTopic} onChange={(e) => setSeoManualTopic(e.target.value)} placeholder="e.g., How to Start a Gratitude Journal" disabled={seoGenerateMutation.isPending} />
              </div>
              <div>
                <Label>Additional Context</Label>
                <Textarea value={seoAdditionalContext} onChange={(e) => setSeoAdditionalContext(e.target.value)} placeholder="Target keywords, audience notes..." rows={2} disabled={seoGenerateMutation.isPending} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => seoGenerateMutation.mutate({ topic: seoManualTopic, action: "generate" })} disabled={seoGenerateMutation.isPending} variant="outline">
                  {seoGenerateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Preview Only
                </Button>
                <Button onClick={() => seoGenerateMutation.mutate({ topic: seoManualTopic, action: "generate-and-save" })} disabled={seoGenerateMutation.isPending}>
                  {seoGenerateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate & Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {seoGeneratedPost && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated: {seoGeneratedPost.title}</span>
                  <Button size="sm" variant="outline" onClick={() => seoValidateMutation.mutate(seoGeneratedPost)} disabled={seoValidateMutation.isPending}>
                    {seoValidateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                    Validate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Slug:</span> /{seoGeneratedPost.slug}</div>
                  <div><span className="font-medium">Words:</span> {seoGeneratedPost.word_count}</div>
                  <div><span className="font-medium">Format:</span> <span className="capitalize">{seoGeneratedPost.format_type}</span></div>
                  <div><span className="font-medium">Type:</span> <span className="capitalize">{seoGeneratedPost.post_type}</span></div>
                  <div><span className="font-medium">Keyword:</span> {seoGeneratedPost.primary_keyword}</div>
                  <div><span className="font-medium">Intent:</span> <span className="capitalize">{seoGeneratedPost.search_intent}</span></div>
                </div>
                <div>
                  <span className="text-sm font-medium">Meta Title:</span>
                  <p className="text-sm text-muted-foreground">{seoGeneratedPost.meta_title} ({seoGeneratedPost.meta_title?.length} chars)</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Meta Description:</span>
                  <p className="text-sm text-muted-foreground">{seoGeneratedPost.meta_description} ({seoGeneratedPost.meta_description?.length} chars)</p>
                </div>
                {seoGeneratedPost.image_prompt && (
                  <div>
                    <span className="text-sm font-medium">Image Prompt:</span>
                    <p className="text-sm text-muted-foreground italic">{seoGeneratedPost.image_prompt}</p>
                  </div>
                )}
                {seoValidationResult && (
                  <div className={`p-3 rounded-lg border ${seoValidationResult.valid ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {seoValidationResult.valid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                      <span className="font-medium text-sm">{seoValidationResult.valid ? "All checks passed" : "Issues found"}</span>
                    </div>
                    {seoValidationResult.issues?.map((issue: string, i: number) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-300">• {issue}</p>
                    ))}
                    {seoValidationResult.warnings?.map((warn: string, i: number) => (
                      <p key={i} className="text-xs text-yellow-700 dark:text-yellow-300">⚠ {warn}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar"><EditorialCalendar /></TabsContent>
        <TabsContent value="backlog"><TopicBacklogManager /></TabsContent>
        <TabsContent value="clusters"><ClusterManager /></TabsContent>
        <TabsContent value="logs"><PublishLogs /></TabsContent>
        <TabsContent value="settings"><SEOSettings /></TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit SEAL Content" : "Create New SEAL Content"}</DialogTitle>
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
