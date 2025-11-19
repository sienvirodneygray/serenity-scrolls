import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, TrendingUp, MousePointerClick, DollarSign } from "lucide-react";
import { AmazonClicksChart } from "./AmazonClicksChart";
import { TopConvertingPages } from "./TopConvertingPages";

export function AmazonAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState({
    totalClicks: 0,
    clicksByProduct: [] as any[],
    clicksBySource: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAmazonAnalytics();
  }, [timeRange]);

  const loadAmazonAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total Amazon clicks
      const { data: clicks, count } = await supabase
        .from("amazon_clicks")
        .select("*", { count: "exact" })
        .gte("timestamp", startDate.toISOString());

      // Group by product
      const productClicks = clicks?.reduce((acc: any, click) => {
        const product = click.product_name || "Unknown";
        acc[product] = (acc[product] || 0) + 1;
        return acc;
      }, {}) || {};

      const clicksByProduct = Object.entries(productClicks)
        .map(([name, count]) => ({ name, count }))
        .sort((a: any, b: any) => b.count - a.count);

      // Group by traffic source
      const sourceClicks = clicks?.reduce((acc: any, click) => {
        const source = click.utm_source || click.utm_campaign || "Direct";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {}) || {};

      const clicksBySource = Object.entries(sourceClicks)
        .map(([source, count]) => ({ source, count }))
        .sort((a: any, b: any) => b.count - a.count);

      setStats({
        totalClicks: count || 0,
        clicksByProduct,
        clicksBySource
      });
    } catch (error) {
      console.error("Error loading Amazon analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Amazon Click Tracking</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor outbound clicks to Amazon product pages
          </p>
        </div>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clicks
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Outbound clicks to Amazon
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Amazon Associates API Not Connected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your Amazon Associates account to track conversions, earnings, and product performance.
                  Currently tracking outbound clicks only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AmazonClicksChart timeRange={timeRange} />
        <TopConvertingPages clicksBySource={stats.clicksBySource} />
      </div>

      {stats.clicksByProduct.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Clicks</CardTitle>
            <CardDescription>Most clicked Amazon products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.clicksByProduct.slice(0, 10).map((product: any, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{product.count} clicks</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
