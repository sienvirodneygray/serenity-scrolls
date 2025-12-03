import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PagesAnalyticsProps {
  timeRange: string;
}

interface PageMetric {
  page_path: string;
  views: number;
  unique_visitors: number;
  avg_time: number;
}

interface EntryExitPage {
  page: string;
  count: number;
  percentage: number;
}

export function PagesAnalytics({ timeRange }: PagesAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [topPages, setTopPages] = useState<PageMetric[]>([]);
  const [entryPages, setEntryPages] = useState<EntryExitPage[]>([]);
  const [exitPages, setExitPages] = useState<EntryExitPage[]>([]);

  useEffect(() => {
    loadPagesAnalytics();
  }, [timeRange]);

  const loadPagesAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all pageviews
      const { data: pageviews } = await supabase
        .from("analytics_pageviews")
        .select("page_path, session_id, time_on_page_seconds")
        .gte("timestamp", startDate.toISOString());

      if (pageviews) {
        // Aggregate page metrics
        const pageMetrics = pageviews.reduce((acc: Record<string, { views: number; sessions: Set<string>; totalTime: number; timeCount: number }>, pv) => {
          if (!acc[pv.page_path]) {
            acc[pv.page_path] = { views: 0, sessions: new Set(), totalTime: 0, timeCount: 0 };
          }
          acc[pv.page_path].views++;
          acc[pv.page_path].sessions.add(pv.session_id);
          if (pv.time_on_page_seconds) {
            acc[pv.page_path].totalTime += pv.time_on_page_seconds;
            acc[pv.page_path].timeCount++;
          }
          return acc;
        }, {});

        const sortedPages = Object.entries(pageMetrics)
          .map(([page_path, data]) => ({
            page_path,
            views: data.views,
            unique_visitors: data.sessions.size,
            avg_time: data.timeCount > 0 ? Math.round(data.totalTime / data.timeCount) : 0
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);

        setTopPages(sortedPages);
      }

      // Get entry pages (from sessions)
      const { data: sessions } = await supabase
        .from("analytics_sessions")
        .select("entry_page, exit_page")
        .gte("first_visit", startDate.toISOString());

      if (sessions) {
        const totalSessions = sessions.length;

        // Entry pages
        const entryCounts = sessions.reduce((acc: Record<string, number>, s) => {
          if (s.entry_page) {
            acc[s.entry_page] = (acc[s.entry_page] || 0) + 1;
          }
          return acc;
        }, {});

        setEntryPages(
          Object.entries(entryCounts)
            .map(([page, count]) => ({
              page,
              count,
              percentage: Math.round((count / totalSessions) * 100)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );

        // Exit pages
        const exitCounts = sessions.reduce((acc: Record<string, number>, s) => {
          if (s.exit_page) {
            acc[s.exit_page] = (acc[s.exit_page] || 0) + 1;
          }
          return acc;
        }, {});

        setExitPages(
          Object.entries(exitCounts)
            .map(([page, count]) => ({
              page,
              count,
              percentage: Math.round((count / totalSessions) * 100)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error("Error loading pages analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Pages Analytics</h2>
      
      {/* Top Pages Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Pages by Views</CardTitle>
        </CardHeader>
        <CardContent>
          {topPages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No page data available yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="page_path" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'views') return [value, 'Views'];
                    if (name === 'unique_visitors') return [value, 'Unique Visitors'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" name="views" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Detailed Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {topPages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Unique Visitors</TableHead>
                  <TableHead className="text-right">Avg Time (s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map((page, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{page.page_path}</TableCell>
                    <TableCell className="text-right">{page.views}</TableCell>
                    <TableCell className="text-right">{page.unique_visitors}</TableCell>
                    <TableCell className="text-right">{page.avg_time}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Entry/Exit Pages */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Entry Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {entryPages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {entryPages.map((page, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-mono text-sm truncate max-w-[200px]">{page.page}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{page.count}</span>
                      <span className="text-sm font-bold">{page.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Exit Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {exitPages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {exitPages.map((page, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-mono text-sm truncate max-w-[200px]">{page.page}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{page.count}</span>
                      <span className="text-sm font-bold">{page.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}