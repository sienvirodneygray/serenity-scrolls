"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import {
  LayoutDashboard,
  Mail,
  Users,
  UserPlus,
  FileUp,
  Settings,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export function CampaignLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "General Settings", href: "/admin", icon: Settings },
    { name: "Campaign Dashboard", href: "/admin/campaigns/dashboard", icon: LayoutDashboard },
    { name: "Campaigns", href: "/admin/campaigns", icon: Mail },
    { name: "Customers & Groups", href: "/admin/customers", icon: Users },
    { name: "Contact Import", href: "/admin/import", icon: FileUp },
    { name: "Sender Identity", href: "/admin/sender-identity", icon: UserPlus },
    { name: "Suppressions", href: "/admin/suppressions", icon: ShieldAlert },
  ];

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden pt-24">
        {/* Sidebar */}
        <aside className="w-64 h-full flex flex-col py-6 px-4 bg-muted/20 border-r border-border/80 flex-shrink-0 overflow-y-auto">
          {/* Logo */}
          <div className="mb-8 px-2 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">Email Platform</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Marketing & CRM
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1.5 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : link.href === "/admin/campaigns"
                  ? pathname.startsWith("/admin/campaigns") && !pathname.startsWith("/admin/campaigns/dashboard")
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border/60 pt-4 px-2">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1.5"
            >
              ← Back to site
            </Link>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-50/40 via-background to-background dark:from-purple-950/5 dark:via-background dark:to-background">
          <div className="max-w-6xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

