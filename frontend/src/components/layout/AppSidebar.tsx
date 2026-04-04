import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  Wallet,
  Building2,
  LogOut,
  Hexagon,
  ClipboardList,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "RFQs", href: "/rfqs", icon: FileText },
  { title: "Orders", href: "/orders", icon: ShoppingCart },
  { title: "Suppliers", href: "/suppliers", icon: Building2 },
  { title: "Financials", href: "/financials", icon: Wallet },
  { title: "Projects", href: "/projects", icon: ClipboardList },
];

const adminNavItems: NavItem[] = [
  { title: "Settings & Admin", href: "/settings", icon: Settings },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isRTL } = useLanguage();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    return (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-2 h-9 px-2 rounded font-body text-[14px] transition-all duration-[120ms] ease-out-expo",
          active
            ? "bg-[rgba(212,146,10,0.08)] border-l-2 border-amber text-amber pl-[calc(0.5rem-2px)]"
            : "text-text-2 hover:bg-surface-2 hover:text-text-1",
          collapsed && "justify-center px-0 border-none",
          collapsed && active && "bg-[rgba(212,146,10,0.08)] border-none text-amber"
        )}
        title={collapsed ? item.title : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" color="currentColor" />
        {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-surface border-border transition-all duration-300",
        isRTL ? "border-l" : "border-r",
        collapsed ? "w-[56px]" : "w-[220px]"
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center px-4 cursor-pointer gap-2",
          collapsed && "justify-center px-2"
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        <Hexagon className="h-6 w-6 text-amber shrink-0 fill-amber/20" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-display text-text-1 text-[16px] leading-tight">
              Construction
            </span>
            <span className="font-display text-text-2 text-[16px] leading-tight">
              Connect
            </span>
          </div>
        )}
      </div>

      <div className="px-3 py-2">
        {!collapsed ? (
          <div className="h-9 w-full bg-surface-2 border border-border-2 rounded flex items-center px-2 text-[13px] text-text-1 cursor-pointer hover:border-amber/40 transition-colors">
            <span className="w-2 h-2 rounded-full bg-success mr-2 shrink-0" />
            <span className="truncate">Riyadh Villa Compound</span>
          </div>
        ) : (
          <div className="h-9 w-full flex justify-center items-center">
             <span className="w-2 h-2 rounded-full bg-success" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-[10px] tracking-[1px] uppercase text-text-3 mt-4 mb-2 px-2 font-medium">
              Navigation
            </p>
          )}
          {mainNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <p className="text-[10px] tracking-[1px] uppercase text-text-3 mt-4 mb-2 px-2 font-medium">
              Admin
            </p>
          )}
          {adminNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-border mt-auto">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded hover:bg-surface-2 transition-colors cursor-pointer" onClick={logout}>
            <div className="flex items-center gap-2 overflow-hidden">
               <div className="w-8 h-8 rounded-full bg-surface-2 border border-border-2 flex items-center justify-center shrink-0">
                  <span className="text-xs text-text-1 font-medium">{user?.name?.charAt(0) || "U"}</span>
               </div>
               <div className="flex flex-col truncate">
                 <span className="text-[13px] text-text-1 font-medium truncate">{user?.name || "User"}</span>
                 <span className="text-[11px] text-text-3 truncate">{user?.role || "Role"}</span>
               </div>
            </div>
            <LogOut className="h-4 w-4 text-text-3 hover:text-text-1" />
          </div>
        ) : (
          <div className="flex justify-center flex-col gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-surface-2 border border-border-2 flex items-center justify-center shrink-0">
                <span className="text-xs text-text-1 font-medium">{user?.name?.charAt(0) || "U"}</span>
            </div>
            <LogOut className="h-4 w-4 text-text-3 hover:text-text-1 cursor-pointer" onClick={logout} />
          </div>
        )}
      </div>
    </aside>
  );
}
