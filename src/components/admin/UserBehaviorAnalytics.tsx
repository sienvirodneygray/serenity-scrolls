import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Sankey, Layer } from "recharts";

interface UserBehaviorAnalyticsProps {
  timeRange: string;
}

interface ClickHotspot {
  page_path: string;
  element_tag: string;
  element_text: string | null;
  click_count: number;
}

interface UserFlow {
  from_page: string;
  to_page: string;
  count: number;
}

interface ScrollDepthData {
  depth: string;
  sessions: number;
}

export function UserBehaviorAnalytics({ timeRange }: UserBehaviorAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [clickHotspots, setClickHotspots] = useState<ClickHotspot[]>([]);
  const [userFlows, setUserFlows] = useState<UserFlow[]>([]);
  const [scrollDepth, setScrollDepth] = useState<ScrollDepthData[]>([]);
  const [avgScrollDepth, setAvgScrollDepth] = useState(0);

  useEffect(() => {
    loadBehaviorAnalytics();
  }, [timeRange]);

  const loadBehaviorAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Load click data
      const { data: clicks } = await supabase
        .from("analytics_clicks")
        .select("page_path, element_tag, element_text")
        .gte("timestamp", startDate.toISOString());

      if (clicks) {
        // Group clicks by element
        const clickGroups = clicks.reduce((acc: Record<string, ClickHotspot>, click) => {
          const key = `${click.page_path}-${click.element_tag}-${click.element_text?.substring(0, 30) || 'unknown'}`;
          if (!acc[key]) {
            acc[key] = {
              page_path: click.page_path,
              element_tag: click.element_tag,
              element_text: click.element_text?.substring(0, 50) || null,
              click_count: 0
            };
          }
          acc[key].click_count++;
          return acc;
        }, {});
        
        setClickHotspots(
          Object.values(clickGroups)
            .sort((a, b) => b.click_count - a.click_count)
            .slice(0, 10)
        );
      }

      // Load user flow data
      const { data: flows } = await supabase
        .from("analytics_user_flows")
        .select("from_page, to_page")
        .gte("timestamp", startDate.toISOString());

      if (flows) {
        const flowGroups = flows.reduce((acc: Record<string, UserFlow>, flow) => {
          const key = `${flow.from_page}->${flow.to_page}`;
          if (!acc[key]) {
            acc[key] = {
              from_page: flow.from_page,
              to_page: flow.to_page,
              count: 0
            };
          }
          acc[key].count++;
          return acc;
        }, {});
        
        setUserFlows(
          Object.values(flowGroups)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        );
      }

      // Load scroll depth from analytics_events
      const { data: events } = await supabase
        .from("analytics_events")
        .select("properties")
        .gte("created_at", startDate.toISOString());

      if (events) {
        const scrollDepths: number[] = [];
        events.forEach(event => {
          const props = event.properties as { scroll_depth?: number } | null;
          if (props?.scroll_depth) {
            scrollDepths.push(props.scroll_depth);
          }
        });

        if (scrollDepths.length > 0) {
          const avg = Math.round(scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length);
          setAvgScrollDepth(avg);

          // Group into buckets
          const buckets = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
          scrollDepths.forEach(depth => {
            if (depth <= 25) buckets['0-25%']++;
            else if (depth <= 50) buckets['26-50%']++;
            else if (depth <= 75) buckets['51-75%']++;
            else buckets['76-100%']++;
          });
          
          setScrollDepth(Object.entries(buckets).map(([depth, sessions]) => ({ depth, sessions })));
        }
      }
    } catch (error) {
      console.error("Error loading behavior analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Behavior</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Click Hotspots */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Most Clicked Elements</CardTitle>
          </CardHeader>
          <CardContent>
            {clickHotspots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No click data available yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Element</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clickHotspots.map((hotspot, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{hotspot.page_path}</TableCell>
                      <TableCell>{hotspot.element_tag}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{hotspot.element_text || '-'}</TableCell>
                      <TableCell className="text-right font-bold">{hotspot.click_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* User Flows */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Navigation Paths</CardTitle>
          </CardHeader>
          <CardContent>
            {userFlows.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No flow data available yet</p>
            ) : (
              <div className="space-y-2">
                {userFlows.map((flow, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono">{flow.from_page}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono">{flow.to_page}</span>
                    </div>
                    <span className="font-bold text-sm">{flow.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scroll Depth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scroll Depth Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {scrollDepth.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No scroll data available yet</p>
                <p className="text-sm text-muted-foreground mt-2">Average: {avgScrollDepth}%</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Average scroll depth: {avgScrollDepth}%</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={scrollDepth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="depth" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}