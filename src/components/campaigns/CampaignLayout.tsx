"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <div className="min-h-screen" style={{ background: "hsl(240 10% 5%)" }}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className="w-60 h-full flex flex-col py-6 px-3 flex-shrink-0"
          style={{
            background: "hsl(240 10% 7%)",
            borderRight: "1px solid hsl(240 8% 12%)",
          }}
        >
          {/* Logo */}
          <div className="mb-8 px-3 flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(280 70% 45%))",
              }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Email Platform</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(240 10% 45%)" }}>
                Marketing & CRM
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-0.5 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (pathname.startsWith(link.href) && link.href !== "/admin");
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm"
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(135deg, hsl(262 83% 58% / 0.2), hsl(280 70% 45% / 0.1))",
                          color: "hsl(270 90% 75%)",
                          borderLeft: "2px solid hsl(262 83% 65%)",
                          paddingLeft: "10px",
                        }
                      : {
                          color: "hsl(240 10% 50%)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "hsl(240 10% 80%)";
                      e.currentTarget.style.background = "hsl(240 8% 11%)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "hsl(240 10% 50%)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-3 pt-4" style={{ borderTop: "1px solid hsl(240 8% 12%)" }}>
            <Link
              href="/"
              className="text-xs transition-colors"
              style={{ color: "hsl(240 10% 35%)" }}
            >
              ← Back to site
            </Link>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto" style={{ background: "hsl(240 10% 6%)" }}>
          <div className="max-w-6xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
