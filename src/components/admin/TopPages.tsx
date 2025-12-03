import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";

interface TopPagesProps {
  timeRange: string;
  dateRange?: DateRange;
}

export function TopPages({ timeRange, dateRange }: TopPagesProps) {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopPages();
  }, [timeRange, dateRange]);

  const getDateRange = () => {
    if (timeRange === "custom" && dateRange?.from) {
      return {
        start: dateRange.from,
        end: dateRange.to || new Date()
      };
    }
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return { start: startDate, end: new Date() };
  };

  const loadTopPages = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();

      const { data: pageviews } = await supabase
        .from("analytics_pageviews")
        .select("page_path, page_title")
        .gte("timestamp", start.toISOString())
        .lte("timestamp", end.toISOString());

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
