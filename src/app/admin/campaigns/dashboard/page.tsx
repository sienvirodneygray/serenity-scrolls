import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, Users, Briefcase } from "lucide-react";

export default function CampaignDashboardPage() {
  // In a real application, these would be fetched via Supabase Server Client
  const stats = [
    { name: "Total Emails Sent", value: "24,592", icon: Mail, description: "+12% from last month" },
    { name: "Scheduled Pending", value: "4", icon: Calendar, description: "Next send in 3 hours" },
    { name: "Customer Profiles", value: "1,244", icon: Users, description: "Active targets" },
    { name: "Customer Groups", value: "8", icon: Briefcase, description: "Segmentation pools" },
  ];

  return (
    <CampaignLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h1>
          <p className="text-muted-foreground mt-1">Metrics and upcoming email operations overview.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="col-span-1 border shadow-sm">
            <CardHeader>
              <CardTitle>Upcoming Sends</CardTitle>
              <CardDescription>Scheduled emails pending dispatch.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">Spring Promo: Week {i + 1}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Campaign: Marketing Sequence</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Tomorrow, 9:00 AM</p>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mt-1 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 border shadow-sm">
            <CardHeader>
              <CardTitle>Schedule Calendar</CardTitle>
              <CardDescription>Bird's eye view of your dispatch pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground bg-zinc-50/50 dark:bg-zinc-950/20 rounded-md border border-dashed">
              [ shadcn/ui Calendar Component Integration placeholder ]
            </CardContent>
          </Card>
        </div>
      </div>
    </CampaignLayout>
  );
}
