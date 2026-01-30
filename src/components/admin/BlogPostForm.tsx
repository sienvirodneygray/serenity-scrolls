import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, Search } from "lucide-react";
import { FeaturedImageUpload } from "./FeaturedImageUpload";
import { TagInput } from "@/components/ui/tag-input";
import { format } from "date-fns";

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

interface BlogPostFormProps {
  formData: BlogFormData;
  setFormData: (data: BlogFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  isPending: boolean;
}

const CATEGORIES = [
  { value: "faith", label: "Faith" },
  { value: "emotions", label: "Emotions" },
  { value: "family", label: "Family" },
  { value: "devotional", label: "Devotional" },
  { value: "scripture", label: "Scripture" },
  { value: "prayer", label: "Prayer" },
  { value: "gratitude", label: "Gratitude" },
  { value: "healing", label: "Healing" },
];

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const BlogPostForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEditing,
  isPending,
}: BlogPostFormProps) => {
  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: generateSlug(value),
      meta_title: value.length <= 60 ? value : formData.meta_title,
    });
  };

  const handleExcerptChange = (value: string) => {
    setFormData({
      ...formData,
      excerpt: value,
      meta_description: value.length <= 160 ? value : formData.meta_description,
    });
  };

  const handleStatusChange = (newStatus: string) => {
    const updates: Partial<BlogFormData> = {
      status: newStatus,
      published: newStatus === "published",
    };
    
    // Set published_at when first publishing
    if (newStatus === "published" && !formData.published_at) {
      updates.published_at = new Date().toISOString();
    }
    
    setFormData({ ...formData, ...updates });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Post Details</CardTitle>
              <CardDescription>Write your blog post content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter a compelling title..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt / Summary *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleExcerptChange(e.target.value)}
                  placeholder="A brief summary that appears in blog listings..."
                  rows={2}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.excerpt.length} characters (ideal: 100-160)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your blog post content here... Use markdown for formatting:
                  
## Headers
> Scripture blockquotes
- Bullet points
**Bold text**"
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Supports Markdown formatting</span>
                  <span>{formData.content.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Post Settings</CardTitle>
              <CardDescription>Configure post metadata and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="url-friendly-slug"
                    className="flex-1"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-generated from title. Edit if needed.
                </p>
              </div>

              <FeaturedImageUpload
                value={formData.featured_image}
                onChange={(url) => setFormData({ ...formData, featured_image: url })}
                blogTitle={formData.title}
              />

              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.status === "published" && formData.published_at && (
                  <p className="text-xs text-muted-foreground">
                    Published on {format(new Date(formData.published_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground">
                  {formData.status === "published" 
                    ? "Post is visible to the public" 
                    : "Post is saved as draft and not visible"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Search Engine Optimization</CardTitle>
              <CardDescription>Optimize your post for search engines and AI assistants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO-optimized title (uses post title if empty)"
                  maxLength={60}
                />
                <p className={`text-xs ${formData.meta_title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.meta_title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Brief description for search results (uses excerpt if empty)"
                  rows={2}
                  maxLength={160}
                />
                <p className={`text-xs ${formData.meta_description.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.meta_description.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>SEO Keywords</Label>
                <TagInput
                  value={formData.seo_keywords}
                  onChange={(keywords) => setFormData({ ...formData, seo_keywords: keywords })}
                  placeholder="Add keyword..."
                  maxTags={10}
                />
                <p className="text-xs text-muted-foreground">
                  Add keywords that describe your post (press Enter or comma to add)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Long-Tail Queries (AEO)</Label>
                <TagInput
                  value={formData.long_tail_queries}
                  onChange={(queries) => setFormData({ ...formData, long_tail_queries: queries })}
                  placeholder="Add question phrase..."
                  maxTags={8}
                />
                <p className="text-xs text-muted-foreground">
                  Question phrases people search for (e.g., "How do I start journaling?")
                </p>
              </div>

              {/* SEO Preview */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground mb-2">Search Preview:</p>
                <p className="text-primary text-lg truncate">
                  {formData.meta_title || formData.title || "Post Title"}
                </p>
                <p className="text-sm text-muted-foreground">
                  serenityscrollsservant.lovable.app/blog/{formData.slug || "post-slug"}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {formData.meta_description || formData.excerpt || "Post description will appear here..."}
                </p>
              </div>

              {/* Keywords Preview */}
              {formData.seo_keywords.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Keywords ({formData.seo_keywords.length}):</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.seo_keywords.join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isEditing ? "Update Post" : "Create Post"}
        </Button>
      </div>
    </form>
  );
};
