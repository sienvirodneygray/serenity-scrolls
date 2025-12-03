import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

interface TrafficSourcesProps {
  timeRange: string;
  dateRange?: DateRange;
}

export function TrafficSources({ timeRange, dateRange }: TrafficSourcesProps) {
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSourceData();
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

  const loadSourceData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();

      const { data: sessions } = await supabase
        .from("analytics_sessions")
        .select("utm_source, utm_medium, referrer")
        .gte("first_visit", start.toISOString())
        .lte("first_visit", end.toISOString());

      const sources: any = {};
      sessions?.forEach((session) => {
        let source = "Direct";
        if (session.utm_source) {
          source = session.utm_source;
        } else if (session.referrer) {
          try {
            const url = new URL(session.referrer);
            source = url.hostname;
          } catch (e) {
            source = "Referral";
          }
        }
        sources[source] = (sources[source] || 0) + 1;
      });

      const formatted = Object.entries(sources)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value);

      setSourceData(formatted);
    } catch (error) {
      console.error("Error loading source data:", error);
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
        <CardTitle>Traffic Sources</CardTitle>
        <CardDescription>Where visitors come from</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {sourceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
