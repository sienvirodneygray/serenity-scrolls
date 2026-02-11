import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";

interface CalendarSlot {
  date: string;
  day: string;
  post: { id: string; title: string; slug: string; status: string | null; format_type: string | null; post_type: string | null } | null;
  status: "published" | "scheduled" | "open";
}

export const EditorialCalendar = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["editorial-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-engine-scheduler", {
        body: { action: "get-calendar" },
      });
      if (error) throw error;
      return data as { slots: CalendarSlot[]; config: any };
    },
  });

  const statusStyles: Record<string, string> = {
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    open: "bg-muted border-border",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Editorial Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !data?.slots?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No scheduled slots found. Configure your publish schedule in Settings.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.slots.map((slot, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${statusStyles[slot.status]}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {format(parseISO(slot.date), "EEE, MMM d")}
                  </span>
                  <Badge variant={slot.status === "published" ? "default" : slot.status === "scheduled" ? "secondary" : "outline"} className="text-xs">
                    {slot.status}
                  </Badge>
                </div>
                {slot.post ? (
                  <div>
                    <p className="text-xs font-medium truncate">{slot.post.title}</p>
                    <div className="flex gap-1 mt-1">
                      {slot.post.format_type && (
                        <Badge variant="outline" className="text-[10px] capitalize">{slot.post.format_type}</Badge>
                      )}
                      {slot.post.post_type && (
                        <Badge variant="outline" className="text-[10px] capitalize">{slot.post.post_type}</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Auto-generate on this date</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
