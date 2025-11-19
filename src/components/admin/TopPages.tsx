import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TopPages({ timeRange }: { timeRange: string }) {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopPages();
  }, [timeRange]);

  const loadTopPages = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: pageviews } = await supabase
        .from("analytics_pageviews")
        .select("page_path, page_title")
        .gte("timestamp", startDate.toISOString());

      const pageCounts: any = {};
      pageviews?.forEach((pv) => {
        const key = pv.page_path;
        if (!pageCounts[key]) {
          pageCounts[key] = {
            path: pv.page_path,
            title: pv.page_title || "Untitled",
            views: 0
          };
        }
        pageCounts[key].views++;
      });

      const sorted = Object.values(pageCounts)
        .sort((a: any, b: any) => b.views - a.views)
        .slice(0, 10);

      setPages(sorted);
    } catch (error) {
      console.error("Error loading top pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Pages</CardTitle>
        <CardDescription>Most viewed pages</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Path</TableHead>
              <TableHead className="text-right">Views</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell className="text-muted-foreground">{page.path}</TableCell>
                <TableCell className="text-right">{page.views}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
