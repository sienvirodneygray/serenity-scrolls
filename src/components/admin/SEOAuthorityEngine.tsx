import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Play, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOSettings } from "./SEOSettings";
import { TopicBacklogManager } from "./TopicBacklogManager";
import { ClusterManager } from "./ClusterManager";
import { EditorialCalendar } from "./EditorialCalendar";
import { PublishLogs } from "./PublishLogs";

export const SEOAuthorityEngine = () => {
  const queryClient = useQueryClient();
  const [manualTopic, setManualTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: async (opts: { topic?: string; action: string }) => {
      const { data, error } = await supabase.functions.invoke("seo-engine-generate", {
        body: {
          action: opts.action,
          topic: opts.topic || undefined,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setGeneratedPost(data);
      toast({ title: data.saved ? "Post generated & saved!" : "Post generated (preview)" });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["editorial-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["publish-logs"] });
    },
    onError: (err) => toast({ variant: "destructive", title: "Generation failed", description: err.message }),
  });

  const validateMutation = useMutation({
    mutationFn: async (postData: any) => {
      const { data, error } = await supabase.functions.invoke("seo-engine-validate", {
        body: { postData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.valid) {
        toast({ title: "✅ Quality check passed!" });
      } else {
        toast({ variant: "destructive", title: "Quality issues found", description: data.issues?.join("; ") });
      }
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-engine-scheduler", {
        body: { action: "refresh-old-post" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Post refreshed" });
      queryClient.invalidateQueries({ queryKey: ["publish-logs"] });
    },
    onError: (err) => toast({ variant: "destructive", title: "Refresh failed", description: err.message }),
  });

  const triggerPublishMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-engine-scheduler", {
        body: { action: "check-schedule" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Schedule checked" });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["editorial-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["publish-logs"] });
    },
    onError: (err) => toast({ variant: "destructive", title: "Publish failed", description: err.message }),
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                onClick={() => triggerPublishMutation.mutate()}
                disabled={triggerPublishMutation.isPending}
              >
                {triggerPublishMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Force Publish Now
              </Button>
              <Button
                variant="outline"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
              >
                {refreshMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Refresh Old Post
              </Button>
            </CardContent>
          </Card>

          {/* Manual Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Generate SEO Post
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topic (leave empty for auto-selection from backlog)</Label>
                <Input
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  placeholder="e.g., How to Start a Gratitude Journal"
                  disabled={generateMutation.isPending}
                />
              </div>
              <div>
                <Label>Additional Context</Label>
                <Textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Target keywords, audience notes..."
                  rows={2}
                  disabled={generateMutation.isPending}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => generateMutation.mutate({ topic: manualTopic, action: "generate" })}
                  disabled={generateMutation.isPending}
                  variant="outline"
                >
                  {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Preview Only
                </Button>
                <Button
                  onClick={() => generateMutation.mutate({ topic: manualTopic, action: "generate-and-save" })}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate & Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Post Preview */}
          {generatedPost && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated: {generatedPost.title}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => validateMutation.mutate(generatedPost)}
                    disabled={validateMutation.isPending}
                  >
                    {validateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                    Validate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Slug:</span> /{generatedPost.slug}</div>
                  <div><span className="font-medium">Words:</span> {generatedPost.word_count}</div>
                  <div><span className="font-medium">Format:</span> <span className="capitalize">{generatedPost.format_type}</span></div>
                  <div><span className="font-medium">Type:</span> <span className="capitalize">{generatedPost.post_type}</span></div>
                  <div><span className="font-medium">Keyword:</span> {generatedPost.primary_keyword}</div>
                  <div><span className="font-medium">Intent:</span> <span className="capitalize">{generatedPost.search_intent}</span></div>
                </div>
                <div>
                  <span className="text-sm font-medium">Meta Title:</span>
                  <p className="text-sm text-muted-foreground">{generatedPost.meta_title} ({generatedPost.meta_title?.length} chars)</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Meta Description:</span>
                  <p className="text-sm text-muted-foreground">{generatedPost.meta_description} ({generatedPost.meta_description?.length} chars)</p>
                </div>
                {generatedPost.image_prompt && (
                  <div>
                    <span className="text-sm font-medium">Image Prompt:</span>
                    <p className="text-sm text-muted-foreground italic">{generatedPost.image_prompt}</p>
                  </div>
                )}

                {validationResult && (
                  <div className={`p-3 rounded-lg border ${validationResult.valid ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {validationResult.valid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                      <span className="font-medium text-sm">{validationResult.valid ? "All checks passed" : "Issues found"}</span>
                    </div>
                    {validationResult.issues?.map((issue: string, i: number) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-300">• {issue}</p>
                    ))}
                    {validationResult.warnings?.map((warn: string, i: number) => (
                      <p key={i} className="text-xs text-yellow-700 dark:text-yellow-300">⚠ {warn}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <EditorialCalendar />
        </TabsContent>

        <TabsContent value="backlog">
          <TopicBacklogManager />
        </TabsContent>

        <TabsContent value="clusters">
          <ClusterManager />
        </TabsContent>

        <TabsContent value="logs">
          <PublishLogs />
        </TabsContent>

        <TabsContent value="settings">
          <SEOSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
