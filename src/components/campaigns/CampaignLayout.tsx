"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mail, Users, UserPlus, FileUp, Settings, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export function CampaignLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "General Settings", href: "/admin", icon: Settings },
    { name: "Campaign Dashboard", href: "/admin/campaigns/dashboard", icon: LayoutDashboard },
    { name: "Automations & Campaigns", href: "/admin/campaigns", icon: Mail },
    { name: "Customers & Groups", href: "/admin/customers", icon: Users },
    { name: "Contact Import", href: "/admin/import", icon: FileUp },
    { name: "Sender Identity", href: "/admin/sender-identity", icon: UserPlus },
    { name: "Suppressions", href: "/admin/suppressions", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)] mt-16">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card h-full flex flex-col py-6 px-3 shadow-sm">
          <div className="mb-6 px-3">
            <h2 className="text-lg font-bold">Email Platform</h2>
            <p className="text-sm text-muted-foreground">Marketing & CRM</p>
          </div>
          <nav className="space-y-1 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/admin");
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
