"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Users, Mail, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { format, addHours } from "date-fns";

interface BroadcastForm {
  subject: string;
  content_html: string;
  sender_id: string;
  send_immediately: boolean;
  scheduled_at: string;
  target_all: boolean;
  group_ids: string[];
}

export default function ComposeBroadcastPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [targetAll, setTargetAll] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const { control, register, handleSubmit, watch, formState: { errors } } = useForm<BroadcastForm>({
    defaultValues: {
      send_immediately: true,
      scheduled_at: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const sendImmediately = watch("send_immediately");

  const { data: senders } = useQuery({
    queryKey: ["sender-identities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sender_identities").select("*").order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["customer_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_groups")
        .select("id, name, customer_group_memberships ( count )")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: totalCustomers } = useQuery({
    queryKey: ["dashboard-customer-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("customers").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (values: BroadcastForm) => {
      // 1. Create a one-off campaign
      const { data: campaign, error: campErr } = await supabase
        .from("email_campaigns")
        .insert({ name: `Scheduled: ${values.subject}`, status: "active", campaign_type: "manual" })
        .select("id")
        .single();
      if (campErr) throw campErr;

      // 2. Create template
      const { data: template, error: tmplErr } = await supabase
        .from("email_templates")
        .insert({ campaign_id: campaign.id, subject: values.subject, content_html: values.content_html, sequence_order: 1 })
        .select("id")
        .single();
      if (tmplErr) throw tmplErr;

      // 3. Link target groups if not targeting all
      if (!targetAll && selectedGroups.length > 0) {
        await supabase.from("campaign_target_groups").insert(
          selectedGroups.map((gid) => ({ campaign_id: campaign.id, group_id: gid }))
        );
      }

      // 4. Create schedule
      const scheduleTime = values.send_immediately ? new Date().toISOString() : new Date(values.scheduled_at).toISOString();
      const { error: schedErr } = await supabase.from("campaign_schedules").insert({
        campaign_id: campaign.id,
        email_template_id: template.id,
        scheduled_at: scheduleTime,
        status: "pending",
      });
      if (schedErr) throw schedErr;

      return campaign.id;
    },
    onSuccess: () => {
      toast({ title: "Broadcast scheduled!", description: "Your email has been queued for dispatch." });
      router.push("/admin/campaigns");
    },
    onError: (err: any) => {
      toast({ title: "Failed to schedule", description: err.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: BroadcastForm) => sendMutation.mutate(data);

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  return (
    <CampaignLayout>
      <div className="space-y-8 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/campaigns"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Broadcast Email</h1>
            <p className="text-muted-foreground mt-1">Send a one-off email to your audience.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sender */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" /> From
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!senders || senders.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No sender identities configured.{" "}
                  <Link href="/admin/sender-identity" className="text-primary underline">Add one first →</Link>
                </div>
              ) : (
                <Controller
                  name="sender_id"
                  control={control}
                  defaultValue={senders.find((s: any) => s.is_default)?.id ?? senders[0]?.id ?? ""}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sender..." />
                      </SelectTrigger>
                      <SelectContent>
                        {senders.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.from_name} &lt;{s.from_email}&gt;
                            {s.is_default && " (default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Subject & Body */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Email Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  placeholder="Your subject here..."
                  {...register("subject", { required: "Subject is required" })}
                />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email Body (HTML or plain text)</Label>
                <Textarea
                  placeholder="Write your email content here. HTML is supported."
                  rows={10}
                  className="font-mono text-sm"
                  {...register("content_html", { required: "Body is required" })}
                />
                {errors.content_html && <p className="text-xs text-destructive">{errors.content_html.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Audience */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Audience
              </CardTitle>
              <CardDescription>Choose who receives this email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="target-all"
                  checked={targetAll}
                  onCheckedChange={(v) => { setTargetAll(!!v); if (v) setSelectedGroups([]); }}
                />
                <Label htmlFor="target-all" className="cursor-pointer">
                  All customers ({(totalCustomers ?? 0).toLocaleString()} contacts)
                </Label>
              </div>
              {!targetAll && (
                <div className="space-y-2 pl-6">
                  <p className="text-sm text-muted-foreground">Select specific groups:</p>
                  {groups?.map((g: any) => (
                    <div key={g.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`g-${g.id}`}
                        checked={selectedGroups.includes(g.id)}
                        onCheckedChange={() => toggleGroup(g.id)}
                      />
                      <Label htmlFor={`g-${g.id}`} className="cursor-pointer">
                        {g.name}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({g.customer_group_memberships?.[0]?.count ?? 0} members)
                        </span>
                      </Label>
                    </div>
                  ))}
                  {groups?.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No groups created yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Controller
                  name="send_immediately"
                  control={control}
                  render={({ field }) => (
                    <Checkbox id="send-now" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="send-now" className="cursor-pointer">Send immediately</Label>
              </div>
              {!sendImmediately && (
                <div className="space-y-2 pl-6">
                  <Label>Schedule for</Label>
                  <Input
                    type="datetime-local"
                    {...register("scheduled_at")}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={sendMutation.isPending || (!senders || senders.length === 0)}>
              {sendMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> {sendImmediately ? "Send Now" : "Schedule Broadcast"}</>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/campaigns">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </CampaignLayout>
  );
}
