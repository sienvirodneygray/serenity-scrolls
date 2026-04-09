import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Clock, Calendar } from "lucide-react";

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const SEOSettings = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["seo-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [localConfig, setLocalConfig] = useState<any>(null);

  const effectiveConfig = localConfig || config;

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from("seo_config")
        .update(updates as any)
        .eq("id", effectiveConfig.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-config"] });
      toast({ title: "Settings saved" });
      setLocalConfig(null);
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Failed to save", description: err.message });
    },
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!effectiveConfig) return <p className="text-muted-foreground">No configuration found.</p>;

  const handleChange = (field: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...(prev || config), [field]: value }));
  };

  const toggleDay = (day: string) => {
    const current = effectiveConfig.schedule_days || [];
    const updated = current.includes(day) ? current.filter((d: string) => d !== day) : [...current, day];
    handleChange("schedule_days", updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Publishing Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Auto-Publish</Label>
              <p className="text-sm text-muted-foreground">Automatically generate and publish posts on schedule</p>
            </div>
            <Switch
              checked={effectiveConfig.publish_enabled}
              onCheckedChange={(v) => handleChange("publish_enabled", v)}
            />
          </div>

          <div>
            <Label className="text-base mb-2 block">Publish Days</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => (
                <Button
                  key={day}
                  variant={effectiveConfig.schedule_days?.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className="capitalize"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label>Publish Time</Label>
            <Input
              type="time"
              value={effectiveConfig.publish_time?.substring(0, 5) || "09:00"}
              onChange={(e) => handleChange("publish_time", e.target.value + ":00")}
              className="w-32"
            />
          </div>

          <div>
            <Label>Timezone</Label>
            <Input
              value={effectiveConfig.timezone || ""}
              onChange={(e) => handleChange("timezone", e.target.value)}
              placeholder="America/New_York"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Site Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Site Name</Label>
            <Input
              value={effectiveConfig.site_name || ""}
              onChange={(e) => handleChange("site_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Niche Summary</Label>
            <Input
              value={effectiveConfig.niche_summary || ""}
              onChange={(e) => handleChange("niche_summary", e.target.value)}
              placeholder="Faith-based journals, Bible verse scrolls..."
            />
          </div>
          <div>
            <Label>Audience Personas</Label>
            <Input
              value={effectiveConfig.audience_personas || ""}
              onChange={(e) => handleChange("audience_personas", e.target.value)}
              placeholder="Christians seeking spiritual growth..."
            />
          </div>
          <div>
            <Label>CTA Preference</Label>
            <Input
              value={effectiveConfig.cta_preference || ""}
              onChange={(e) => handleChange("cta_preference", e.target.value)}
              placeholder="Encourage readers to explore products..."
            />
          </div>
        </CardContent>
      </Card>

      {localConfig && (
        <Button onClick={() => updateMutation.mutate(localConfig)} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      )}
    </div>
  );
};
