import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface DevicesAnalyticsProps {
  timeRange: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444'];

export function DevicesAnalytics({ timeRange }: DevicesAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceData, setDeviceData] = useState<{ name: string; value: number }[]>([]);
  const [browserData, setBrowserData] = useState<{ name: string; value: number }[]>([]);
  const [osData, setOsData] = useState<{ name: string; value: number }[]>([]);
  const [screenData, setScreenData] = useState<{ resolution: string; count: number }[]>([]);

  useEffect(() => {
    loadDeviceAnalytics();
  }, [timeRange]);

  const loadDeviceAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions } = await supabase
        .from("analytics_sessions")
        .select("device_type, browser, os, screen_width, screen_height")
        .gte("first_visit", startDate.toISOString());

      if (sessions) {
        // Device type breakdown
        const deviceCounts = sessions.reduce((acc: Record<string, number>, s) => {
          const device = s.device_type || 'unknown';
          acc[device] = (acc[device] || 0) + 1;
          return acc;
        }, {});
        setDeviceData(Object.entries(deviceCounts).map(([name, value]) => ({ name, value })));

        // Browser breakdown
        const browserCounts = sessions.reduce((acc: Record<string, number>, s) => {
          const browser = s.browser || 'unknown';
          acc[browser] = (acc[browser] || 0) + 1;
          return acc;
        }, {});
        setBrowserData(Object.entries(browserCounts).map(([name, value]) => ({ name, value })));

        // OS breakdown
        const osCounts = sessions.reduce((acc: Record<string, number>, s) => {
          const os = s.os || 'unknown';
          acc[os] = (acc[os] || 0) + 1;
          return acc;
        }, {});
        setOsData(Object.entries(osCounts).map(([name, value]) => ({ name, value })));

        // Screen resolution breakdown
        const screenCounts = sessions.reduce((acc: Record<string, number>, s) => {
          if (s.screen_width && s.screen_height) {
            const resolution = `${s.screen_width}x${s.screen_height}`;
            acc[resolution] = (acc[resolution] || 0) + 1;
          }
          return acc;
        }, {});
        const sortedScreens = Object.entries(screenCounts)
          .map(([resolution, count]) => ({ resolution, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        setScreenData(sortedScreens);
      }
    } catch (error) {
      console.error("Error loading device analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Device Analytics</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={browserData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {browserData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operating Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={osData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {osData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Screen Resolutions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={screenData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="resolution" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
