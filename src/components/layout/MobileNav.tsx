import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  TrendingUp,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ElementType;
}

const mobileNavItems: NavItem[] = [
  { titleKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { titleKey: "nav.rfqs", href: "/rfqs", icon: FileText },
  { titleKey: "nav.bids", href: "/bids", icon: TrendingUp },
  { titleKey: "nav.orders", href: "/orders", icon: ShoppingCart },
  { titleKey: "nav.more", href: "/menu", icon: Menu },
];

export function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-4 min-w-0 flex-1",
              "text-muted-foreground transition-colors",
              isActive(item.href) && "text-primary"
            )}
          >
            <item.icon className={cn(
              "h-6 w-6 mb-1",
              isActive(item.href) && "text-primary"
            )} />
            <span className={cn(
              "text-xs font-medium truncate",
              isActive(item.href) && "text-primary"
            )}>
              {t(item.titleKey)}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
