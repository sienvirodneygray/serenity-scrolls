import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function AmazonClicksChart({ timeRange }: { timeRange: string }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [timeRange]);

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: clicks } = await supabase
        .from("amazon_clicks")
        .select("timestamp")
        .gte("timestamp", startDate.toISOString())
        .order("timestamp", { ascending: true });

      // Group by day
      const dailyData: any = {};
      clicks?.forEach((click) => {
        const date = new Date(click.timestamp).toLocaleDateString();
        dailyData[date] = (dailyData[date] || 0) + 1;
      });

      const formatted = Object.entries(dailyData).map(([date, clicks]) => ({
        date,
        clicks
      }));

      setChartData(formatted);
    } catch (error) {
      console.error("Error loading Amazon chart data:", error);
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
        <CardTitle>Amazon Clicks Over Time</CardTitle>
        <CardDescription>Daily outbound clicks to Amazon</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Bar dataKey="clicks" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
