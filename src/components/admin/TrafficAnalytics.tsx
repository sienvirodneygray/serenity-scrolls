import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, Clock, MousePointerClick, TrendingUp, ArrowDown } from "lucide-react";
import { TrafficChart } from "./TrafficChart";
import { TopPages } from "./TopPages";
import { TrafficSources } from "./TrafficSources";

export function TrafficAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
    amazonClicks: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total sessions
      const { count: totalSessions } = await supabase
        .from("analytics_sessions")
        .select("*", { count: "exact", head: true })
        .gte("first_visit", startDate.toISOString());

      // Get unique visitors (unique session_ids)
      const { data: sessions } = await supabase
        .from("analytics_sessions")
        .select("session_id")
        .gte("first_visit", startDate.toISOString());

      // Get total pageviews
      const { count: totalPageviews } = await supabase
        .from("analytics_pageviews")
        .select("*", { count: "exact", head: true })
        .gte("timestamp", startDate.toISOString());

      // Get Amazon clicks
      const { count: amazonClicks } = await supabase
        .from("amazon_clicks")
        .select("*", { count: "exact", head: true })
        .gte("timestamp", startDate.toISOString());

      // Calculate bounce rate (sessions with only 1 pageview)
      const { data: pageviewCounts } = await supabase
        .from("analytics_pageviews")
        .select("session_id")
        .gte("timestamp", startDate.toISOString());

      const sessionPageviews = pageviewCounts?.reduce((acc: any, pv) => {
        acc[pv.session_id] = (acc[pv.session_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const bounces = Object.values(sessionPageviews).filter((count: any) => count === 1).length;
      const bounceRate = totalSessions ? Math.round((bounces / totalSessions) * 100) : 0;

      // Get average time on page
      const { data: sessionData } = await supabase
        .from("analytics_sessions")
        .select("total_time_seconds")
        .gte("first_visit", startDate.toISOString());

      const avgTime = sessionData?.length
        ? Math.round(sessionData.reduce((acc, s) => acc + (s.total_time_seconds || 0), 0) / sessionData.length)
        : 0;

      setStats({
        totalVisits: totalPageviews || 0,
        uniqueVisitors: sessions?.length || 0,
        avgTimeOnPage: avgTime,
        bounceRate,
        amazonClicks: amazonClicks || 0
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Traffic Overview</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Visits
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Time on Page
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTimeOnPage}s</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bounce Rate
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounceRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amazon Clicks
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.amazonClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TrafficChart timeRange={timeRange} />
        <TrafficSources timeRange={timeRange} />
      </div>

      <TopPages timeRange={timeRange} />
    </div>
  );
}
