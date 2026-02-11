import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScrollText } from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  post_id: string | null;
  scheduled_for: string;
  attempted_at: string | null;
  status: string;
  error_message: string | null;
  retry_count: number;
  action_type: string;
  created_at: string;
  post?: { title: string } | null;
}

export const PublishLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["publish-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publish_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Fetch post titles
      const postIds = (data || []).map(l => l.post_id).filter(Boolean);
      let postsMap: Record<string, string> = {};
      if (postIds.length > 0) {
        const { data: posts } = await supabase.from("blog_posts").select("id, title").in("id", postIds);
        postsMap = Object.fromEntries((posts || []).map(p => [p.id, p.title]));
      }

      return (data || []).map((l): LogEntry => ({
        ...l,
        post: l.post_id ? { title: postsMap[l.post_id] || "Unknown" } : null,
      }));
    },
  });

  const statusStyles: Record<string, string> = {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    retrying: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" /> Publish Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !logs?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No publish activity yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {log.attempted_at ? format(new Date(log.attempted_at), "MMM d, HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">{log.action_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {log.post?.title || "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusStyles[log.status] || ""}`}>
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{log.retry_count}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                    {log.error_message || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
