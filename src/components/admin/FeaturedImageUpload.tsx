import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Upload, Sparkles, Link, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeaturedImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  blogTitle?: string;
}

export const FeaturedImageUpload = ({ value, onChange, blogTitle }: FeaturedImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Please upload an image file." });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Please upload an image under 5MB." });
      return;
    }

    setIsUploading(true);
    try {
      const filename = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      const { data, error } = await supabase.storage
        .from("blog-images")
        .upload(filename, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filename);

      onChange(publicUrlData.publicUrl);
      toast({ title: "Image uploaded successfully!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-blog-image", {
        body: { 
          prompt: aiPrompt || undefined,
          blogTitle: blogTitle 
        },
      });

      if (response.error) throw response.error;

      if (response.data?.imageUrl) {
        onChange(response.data.imageUrl);
        toast({ title: "Image generated successfully!" });
        setAiPrompt("");
      } else if (response.data?.error) {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({ 
        variant: "destructive", 
        title: "Generation failed", 
        description: error.message || "Failed to generate image" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-4">
      <Label>Featured Image</Label>
      
      {value ? (
        <div className="relative rounded-lg overflow-hidden border">
          <img 
            src={value} 
            alt="Featured" 
            className="w-full h-48 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 bg-muted/30">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div className="text-center">
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload an image from your device
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 5MB. Supported: JPG, PNG, GIF, WebP
                </p>
              </div>
            </TabsContent>

            {/* AI Generate Tab */}
            <TabsContent value="generate" className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate a custom featured image using AI. Leave the prompt empty to auto-generate based on the blog title.
                </p>
                <Textarea
                  placeholder="Describe the image you want (optional)... 
e.g., 'A peaceful sunrise over mountains with soft golden light' or 'An open Bible on a wooden table with morning light'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
                <Button 
                  type="button" 
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Uses Lovable AI to create faith-themed imagery
                </p>
              </div>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Paste a direct URL to an image
                </p>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  onChange={(e) => onChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Make sure the image URL is publicly accessible
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
