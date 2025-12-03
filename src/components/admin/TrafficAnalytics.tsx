import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Eye, Clock, MousePointerClick, ArrowDown, CalendarIcon } from "lucide-react";
import { TrafficChart } from "./TrafficChart";
import { TopPages } from "./TopPages";
import { TrafficSources } from "./TrafficSources";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export function TrafficAnalytics() {
  const [timeRange, setTimeRange] = useState("7");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });
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
  }, [timeRange, dateRange]);

  const getStartDate = () => {
    if (timeRange === "custom" && dateRange?.from) {
      return dateRange.from;
    }
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return startDate;
  };

  const getEndDate = () => {
    if (timeRange === "custom" && dateRange?.to) {
      return dateRange.to;
    }
    return new Date();
  };

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();

      // Get total sessions
      const { count: totalSessions } = await supabase
        .from("analytics_sessions")
        .select("*", { count: "exact", head: true })
        .gte("first_visit", startDate.toISOString())
        .lte("first_visit", endDate.toISOString());

      // Get unique visitors (unique session_ids)
      const { data: sessions } = await supabase
        .from("analytics_sessions")
        .select("session_id")
        .gte("first_visit", startDate.toISOString())
        .lte("first_visit", endDate.toISOString());

      // Get total pageviews
      const { count: totalPageviews } = await supabase
        .from("analytics_pageviews")
        .select("*", { count: "exact", head: true })
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      // Get Amazon clicks
      const { count: amazonClicks } = await supabase
        .from("amazon_clicks")
        .select("*", { count: "exact", head: true })
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      // Calculate bounce rate (sessions with only 1 pageview)
      const { data: pageviewCounts } = await supabase
        .from("analytics_pageviews")
        .select("session_id")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

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
        .gte("first_visit", startDate.toISOString())
        .lte("first_visit", endDate.toISOString());

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

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    if (value !== "custom") {
      const days = parseInt(value);
      setDateRange({
        from: new Date(new Date().setDate(new Date().getDate() - days)),
        to: new Date()
      });
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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Traffic Overview</h2>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
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
        <TrafficChart timeRange={timeRange} dateRange={dateRange} />
        <TrafficSources timeRange={timeRange} dateRange={dateRange} />
      </div>

      <TopPages timeRange={timeRange} dateRange={dateRange} />
    </div>
  );
}
