"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formSchema = z.object({
  purpose: z.string().min(5, "Purpose must be at least 5 characters."),
  target_age_group: z.string().min(1, "Please select a target age group."),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  feedback: z.string().optional(),
});

type EmailGenerationResponse = {
  emails: { sequence_order: number; subject: string; content: string }[];
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [generatedEmails, setGeneratedEmails] = useState<EmailGenerationResponse["emails"] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: "",
      target_age_group: "",
      link: "",
      feedback: "",
    },
  });

  const aiMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Proxying through Next.js API or reaching out to Cloud Run directly. 
      // For this implementation we call the Cloud Run service directly (assuming CORS is configured).
      const res = await fetch("http://localhost:8081/generate-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("AI Generation Failed");
      return (await res.json()) as EmailGenerationResponse;
    },
    onSuccess: (data) => {
      setGeneratedEmails(data.emails);
      setIsPreviewOpen(true);
      toast.success("AI significantly engineered 5 precise marketing emails!");
    },
    onError: () => {
      toast.error("Failed to generate the sequence. Please try again.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!campaignName || !generatedEmails) throw new Error("Campaign name required.");
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // 1. Create Campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          name: campaignName,
          status: "draft",
          campaign_type: "ai_funnel",
          created_by: userData.user.id
        })
        .select()
        .single();
      
      if (campaignError) throw campaignError;

      // 2. Insert Templates
      const templatesToInsert = generatedEmails.map(email => ({
        campaign_id: campaign.id,
        sequence_order: email.sequence_order,
        subject: email.subject,
        content_html: email.content,
      }));

      const { error: templatesError } = await supabase
        .from("email_templates")
        .insert(templatesToInsert);

      if (templatesError) throw templatesError;
      return campaign;
    },
    onSuccess: (data) => {
      toast.success("Campaign Saved as Draft!");
      router.push(`/admin/campaigns/${data.id}/setup`);
    },
    onError: (error) => {
      toast.error(`Save failed: ${(error as Error).message}`);
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    aiMutation.mutate(values);
  }

  return (
    <CampaignLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Funnel Creator</h1>
          <p className="text-muted-foreground mt-1">
            Let Vertex AI Agent construct an optimized 5-email automated sales funnel.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Funnel Architecture</CardTitle>
            <CardDescription>Define the strategy and the engine will synthesize the copy.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Purpose</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Promote the new Serenity Scrolls guided journal bundle" {...field} />
                      </FormControl>
                      <FormDescription>The primary goal or offering.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_age_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Demographic</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an age group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="18-24">18-24 (Gen Z)</SelectItem>
                          <SelectItem value="25-34">25-34 (Millennials)</SelectItem>
                          <SelectItem value="35-44">35-44 (Young Gen X)</SelectItem>
                          <SelectItem value="45-54">45-54 (Gen X)</SelectItem>
                          <SelectItem value="55-64">55-64 (Boomers I)</SelectItem>
                          <SelectItem value="65+">65+ (Boomers II)</SelectItem>
                          <SelectItem value="all ages">All Ages</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call-To-Action Link (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={aiMutation.isPending} className="w-full">
                  {aiMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Synthesize Sequences
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* AI Output Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Generated Funnel Review</DialogTitle>
              <DialogDescription>
                Review the 5-part structure. You can request a regeneration below if needed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 my-4">
              {generatedEmails?.map((email) => (
                <div key={email.sequence_order} className="border rounded-md shadow-sm">
                  <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
                    <span className="font-semibold text-sm">Sequence {email.sequence_order}/5</span>
                    <span className="text-sm text-muted-foreground">{email.subject}</span>
                  </div>
                  <div 
                    className="p-4 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: email.content }} 
                  />
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div>
                <FormLabel>Need adjustments?</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g., Make it funnier, remove the second link..." 
                    value={form.watch('feedback')}
                    onChange={(e) => form.setValue('feedback', e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => { setIsPreviewOpen(false); form.handleSubmit(onSubmit)(); }}
                    disabled={aiMutation.isPending}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>

              <div>
                <FormLabel>Name your Campaign to Save</FormLabel>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={campaignName} 
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Spring Promo Funnel"
                  />
                  <Button 
                    onClick={() => saveMutation.mutate()} 
                    disabled={!campaignName || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save & Continue Setup"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </CampaignLayout>
  );
}
