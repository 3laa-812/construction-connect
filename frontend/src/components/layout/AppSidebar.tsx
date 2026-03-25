import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  Users,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  Shield,
  Wallet,
  Store,
  FileClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { titleKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { titleKey: "nav.rfqs", href: "/rfqs", icon: FileText, badge: 5 },
  { titleKey: "nav.bids", href: "/bids", icon: TrendingUp, badge: 12 },
  { titleKey: "nav.orders", href: "/orders", icon: ShoppingCart },
  { titleKey: "nav.financials", href: "/financials", icon: Wallet },
];

const managementNavItems: NavItem[] = [
  { titleKey: "nav.suppliers", href: "/suppliers", icon: Building2 },
  { titleKey: "nav.supplier_portal", href: "/supplier/rfq-feed", icon: Store },
  { titleKey: "nav.projects", href: "/projects", icon: ClipboardList },
  { titleKey: "nav.suppliers", href: "/users", icon: Users },
];

const adminNavItems: NavItem[] = [
  { titleKey: "nav.approvals", href: "/approvals", icon: Shield, badge: 3 },
  { titleKey: "nav.settings", href: "/admin/audit-logs", icon: FileClock },
  { titleKey: "nav.settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => (
    <NavLink
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        isActive(item.href) &&
          "bg-sidebar-accent text-sidebar-foreground font-medium",
        collapsed && "justify-center px-2",
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{t(item.titleKey)}</span>
          {item.badge && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-sidebar border-sidebar-border transition-all duration-300 border-r rtl:border-r-0 rtl:border-l",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight">
                {t("common.app_name")}
              </h1>
              <p className="text-sidebar-foreground/50 text-xs">
                {t("common.procurement")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Main */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-sidebar-foreground/40 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              {t("common.sidebar.main")}
            </p>
          )}
          {mainNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Management */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-sidebar-foreground/40 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              {t("common.sidebar.management")}
            </p>
          )}
          {managementNavItems.map((item, index) => (
            <NavItemComponent key={`${item.href}-${index}`} item={item} />
          ))}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Admin */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-sidebar-foreground/40 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              {t("common.sidebar.admin")}
            </p>
          )}
          {adminNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "px-2",
          )}
        >
          {collapsed ? (
            isRTL ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <>
              {isRTL ? (
                <ChevronRight className="h-4 w-4 me-2" />
              ) : (
                <ChevronLeft className="h-4 w-4 me-2" />
              )}
              <span>{t("common.sidebar.collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
