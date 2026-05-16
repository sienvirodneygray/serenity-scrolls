import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { DollarSign, ShoppingBag, Package, RefreshCw, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

type Metric = {
  date: string;
  total_orders: number;
  total_units: number;
  total_revenue_usd: number;
};

export function AmazonOrdersAnalytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ["amazon-sales-metrics", timeRange],
    queryFn: async (): Promise<Metric[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const { data, error } = await supabase
        .from("amazon_sales_metrics")
        .select("date, total_orders, total_units, total_revenue_usd")
        .gte("date", startDate.toISOString().substring(0, 10))
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Aggregated totals
  const totals = metrics?.reduce(
    (acc, row) => ({
      orders: acc.orders + row.total_orders,
      units: acc.units + row.total_units,
      revenue: acc.revenue + Number(row.total_revenue_usd),
    }),
    { orders: 0, units: 0, revenue: 0 }
  ) ?? { orders: 0, units: 0, revenue: 0 };

  // Chart data
  const chartData = metrics?.map((row) => ({
    date: new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Revenue: Number(row.total_revenue_usd),
    Orders: row.total_orders,
    Units: row.total_units,
  })) ?? [];

  const handleSyncNow = async () => {
    setIsSyncing(true);
    toast({ title: "Syncing Amazon Orders…", description: "Fetching latest sales data from SP-API." });

    try {
      const { data, error } = await supabase.functions.invoke("sync-amazon-orders", {
        body: { days: parseInt(timeRange) },
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      toast({
        title: "Sync Complete!",
        description: data?.message || "Amazon orders successfully synced.",
      });
      refetch();
    } catch (err: any) {
      console.error("Amazon Orders Sync Error:", err);
      toast({
        title: "Sync Failed",
        description: err.message || "Could not sync Amazon order data.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Amazon Orders Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sales revenue, units, and order volume via SP-API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync Now"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-orange-200 dark:border-orange-900/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.orders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Units Sold</CardTitle>
              <Package className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.units.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue</CardTitle>
          <CardDescription>Revenue trend over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <Package className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No data for this period</p>
              <p className="text-xs mt-1">Click "Sync Now" to pull the latest orders from Amazon.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "Revenue" ? [`$${value.toFixed(2)}`, name] : [value, name]
                  }
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Orders & Units Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders & Units</CardTitle>
            <CardDescription>Daily order count and unit volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="Orders" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Units" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
