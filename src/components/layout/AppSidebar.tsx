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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  titleAr: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", titleAr: "لوحة التحكم", href: "/", icon: LayoutDashboard },
  { title: "RFQs", titleAr: "طلبات عروض الأسعار", href: "/rfqs", icon: FileText, badge: 5 },
  { title: "Bids", titleAr: "العطاءات", href: "/bids", icon: TrendingUp, badge: 12 },
  { title: "Orders", titleAr: "الطلبات", href: "/orders", icon: ShoppingCart },
  { title: "Products", titleAr: "المنتجات", href: "/products", icon: Package },
];

const managementNavItems: NavItem[] = [
  { title: "Suppliers", titleAr: "الموردين", href: "/suppliers", icon: Building2 },
  { title: "Projects", titleAr: "المشاريع", href: "/projects", icon: ClipboardList },
  { title: "Users", titleAr: "المستخدمين", href: "/users", icon: Users },
];

const adminNavItems: NavItem[] = [
  { title: "Approvals", titleAr: "الموافقات", href: "/approvals", icon: Shield, badge: 3 },
  { title: "Settings", titleAr: "الإعدادات", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
        isActive(item.href) && "bg-sidebar-accent text-sidebar-foreground font-medium",
        collapsed && "justify-center px-2"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
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
        "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border px-4",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight">
                BidFlow
              </h1>
              <p className="text-sidebar-foreground/50 text-xs">Procurement</p>
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
              Main
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
              Management
            </p>
          )}
          {managementNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Admin */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-sidebar-foreground/40 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              Admin
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
            collapsed && "px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 me-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
