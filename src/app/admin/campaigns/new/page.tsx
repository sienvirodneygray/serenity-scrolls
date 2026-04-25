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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Wand2, Save, RotateCcw, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formSchema = z.object({
  purpose: z.string().min(5, "Purpose must be at least 5 characters."),
  target_age_group: z.string().min(1, "Please select a target age group."),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  feedback: z.string().optional(),
});

type EmailGenerationResponse = {
  emails: { sequence_order: number; subject: string; content: string }[];
};

// Shared inline-style tokens
const panelStyle = {
  background: "hsl(240 10% 8%)",
  border: "1px solid hsl(240 8% 13%)",
} as const;

const inputStyle = {
  background: "hsl(240 10% 10%)",
  border: "1px solid hsl(240 8% 16%)",
  color: "white",
} as const;

const labelStyle = { color: "hsl(240 10% 65%)", fontSize: "0.8rem", fontWeight: 500 } as const;

export default function NewCampaignPage() {
  const router = useRouter();
  const [generatedEmails, setGeneratedEmails] = useState<EmailGenerationResponse["emails"] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { purpose: "", target_age_group: "", link: "", feedback: "" },
  });

  const aiMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data, error } = await supabase.functions.invoke("generate-funnel", { body: values });
      if (error) throw new Error(error.message || "AI Generation Failed");
      if (data?.error) throw new Error(data.error);
      return data as EmailGenerationResponse;
    },
    onSuccess: (data) => {
      setGeneratedEmails(data.emails);
      setIsPreviewOpen(true);
      toast.success("5-email funnel generated successfully!");
    },
    onError: () => toast.error("Failed to generate the sequence. Please try again."),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!campaignName || !generatedEmails) throw new Error("Campaign name required.");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: campaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({ name: campaignName, status: "draft", campaign_type: "ai_funnel", created_by: userData.user.id })
        .select()
        .single();
      if (campaignError) throw campaignError;

      const { error: templatesError } = await supabase.from("email_templates").insert(
        generatedEmails.map((email) => ({
          campaign_id: campaign.id,
          sequence_order: email.sequence_order,
          subject: email.subject,
          content_html: email.content,
        }))
      );
      if (templatesError) throw templatesError;
      return campaign;
    },
    onSuccess: () => {
      toast.success("Campaign saved as draft!");
      setIsPreviewOpen(false);
      // Redirect to campaigns list — /setup route doesn't exist
      router.push("/admin/campaigns");
    },
    onError: (error) => toast.error(`Save failed: ${(error as Error).message}`),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    aiMutation.mutate(values);
  }

  return (
    <CampaignLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="h-4 w-4" style={{ color: "hsl(262 83% 65%)" }} />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "hsl(262 83% 65%)" }}>
              AI-Powered
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Funnel Creator</h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(240 10% 45%)" }}>
            Generate an optimized 5-email automated sales funnel with AI.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl p-6" style={panelStyle}>
          <div className="mb-6">
            <p className="text-sm font-semibold text-white">Funnel Architecture</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(240 10% 40%)" }}>
              Define the strategy and the engine will synthesize the copy.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={labelStyle}>Campaign Purpose</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Promote the new Serenity Scrolls guided journal bundle"
                        {...field}
                        className="h-11 placeholder:text-zinc-600"
                        style={inputStyle}
                      />
                    </FormControl>
                    <FormDescription style={{ color: "hsl(240 10% 35%)", fontSize: "0.75rem" }}>
                      The primary goal or offering.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_age_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={labelStyle}>Target Demographic</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11" style={inputStyle}>
                          <SelectValue placeholder="Select an age group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent style={{ background: "hsl(240 10% 10%)", border: "1px solid hsl(240 8% 16%)" }}>
                        {["18-24 (Gen Z)", "25-34 (Millennials)", "35-44 (Young Gen X)", "45-54 (Gen X)", "55-64 (Boomers I)", "65+ (Boomers II)", "All Ages"].map((label) => (
                          <SelectItem
                            key={label}
                            value={label.split(" ")[0]}
                            style={{ color: "hsl(240 10% 70%)" }}
                          >
                            {label}
                          </SelectItem>
                        ))}
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
                    <FormLabel style={labelStyle}>Call-To-Action Link <span style={{ color: "hsl(240 10% 35%)" }}>(Optional)</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://serenityscrolls.faith/shop"
                        {...field}
                        className="h-11 placeholder:text-zinc-600"
                        style={inputStyle}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={aiMutation.isPending}
                className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(280 70% 50%))",
                  boxShadow: aiMutation.isPending ? "none" : "0 0 20px hsl(262 83% 58% / 0.35)",
                }}
              >
                {aiMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Synthesizing sequences…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Synthesize Sequences</>
                )}
              </button>
            </form>
          </Form>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="max-w-3xl max-h-[85vh] overflow-y-auto"
          style={{ background: "hsl(240 10% 8%)", border: "1px solid hsl(240 8% 14%)", color: "white" }}
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "hsl(262 83% 65%)" }} />
              AI Generated Funnel
            </DialogTitle>
            <DialogDescription style={{ color: "hsl(240 10% 45%)" }}>
              Review the 5-part sequence. Provide feedback to regenerate or save as a draft.
            </DialogDescription>
          </DialogHeader>

          {/* Email Previews */}
          <div className="space-y-4 my-2">
            {generatedEmails?.map((email) => (
              <div key={email.sequence_order} className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(240 8% 15%)" }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ background: "hsl(240 10% 11%)", borderBottom: "1px solid hsl(240 8% 15%)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "hsl(262 83% 58% / 0.2)", color: "hsl(270 90% 72%)" }}>
                      {email.sequence_order}
                    </div>
                    <span className="text-xs font-medium" style={{ color: "hsl(240 10% 55%)" }}>Sequence {email.sequence_order}/5</span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate max-w-xs">{email.subject}</span>
                </div>
                <div
                  className="p-4 prose prose-sm prose-invert max-w-none text-xs leading-relaxed"
                  style={{ color: "hsl(240 10% 60%)" }}
                  dangerouslySetInnerHTML={{ __html: email.content }}
                />
              </div>
            ))}
          </div>

          {/* Feedback & Save Row */}
          <div className="space-y-4 pt-4" style={{ borderTop: "1px solid hsl(240 8% 13%)" }}>
            {/* Feedback / Regenerate */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "hsl(240 10% 50%)" }}>Need adjustments?</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 rounded-lg px-3 text-sm placeholder:text-zinc-600 text-white outline-none"
                  style={inputStyle}
                  placeholder="e.g., Make the tone warmer, add urgency..."
                  value={form.watch("feedback")}
                  onChange={(e) => form.setValue("feedback", e.target.value)}
                />
                <button
                  onClick={() => { setIsPreviewOpen(false); form.handleSubmit(onSubmit)(); }}
                  disabled={aiMutation.isPending}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ background: "hsl(240 10% 13%)", border: "1px solid hsl(240 8% 18%)", color: "hsl(240 10% 65%)" }}
                >
                  <RotateCcw className="h-3 w-3" /> Regenerate
                </button>
              </div>
            </div>

            {/* Save */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "hsl(240 10% 50%)" }}>Save as campaign draft</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 rounded-lg px-3 text-sm placeholder:text-zinc-600 text-white outline-none"
                  style={inputStyle}
                  placeholder="e.g., Spring Promo Funnel"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={!campaignName || saveMutation.isPending}
                  className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(280 70% 50%))",
                  }}
                >
                  {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CampaignLayout>
  );
}
