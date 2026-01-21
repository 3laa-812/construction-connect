import { Bell, Search, User, Globe, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSync } from "@/hooks/useSync";

export function TopBar() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { sync, isSyncing } = useSync();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-50">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">BF</span>
        </div>
        <span className="font-bold text-foreground">BidFlow</span>
      </div>

      {/* Search - Desktop */}
      <div className="hidden lg:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            placeholder={t("common.search_placeholder")}
            className={cn("bg-muted/20 border-border/50 focus-visible:bg-background transition-colors placeholder:text-muted-foreground/70", isRTL ? "pr-10" : "pl-10")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
         {/* Sync Button */}
         <Button 
          variant="ghost" 
          size="icon" 
          className={cn("text-muted-foreground transition-all", isSyncing && "animate-spin text-primary")}
          onClick={sync}
          disabled={isSyncing}
          title="Sync Data"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>

        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"}>
            <DropdownMenuItem 
              onClick={() => setLanguage("en")}
              className="flex items-center justify-between gap-2"
            >
              <span>{t("language.english")}</span>
              {language === "en" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setLanguage("ar")}
              className="flex items-center justify-between gap-2"
            >
              <span>{t("language.arabic")}</span>
              {language === "ar" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className={cn(
                "absolute top-1 w-2 h-2 bg-danger rounded-full",
                isRTL ? "left-1" : "right-1"
              )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-80">
            <DropdownMenuLabel>{t("common.notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <StatusBadge variant="primary" size="sm">{t("common.notification_items.new_bid_title")}</StatusBadge>
                <span className="text-xs text-muted-foreground">{t("dashboard.time.min_ago", { count: 2 })}</span>
              </div>
              <p className="text-sm">{t("common.notification_items.new_bid_desc")}</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <StatusBadge variant="success" size="sm">{t("common.notification_items.delivered_title")}</StatusBadge>
                <span className="text-xs text-muted-foreground">{t("dashboard.time.hour_ago", { count: 1 })}</span>
              </div>
              <p className="text-sm">{t("common.notification_items.delivered_desc")}</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"}>
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "contractor" ? t("common.procurement_manager") : 
                   user?.role === "supplier" ? "Supplier" : 
                   user?.role === "admin" ? "Administrator" : 
                   t("common.procurement_manager")}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                navigate("/settings");
              }}
            >
              {t("common.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                navigate("/settings");
              }}
            >
              {t("nav.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-danger"
              onClick={() => {
                logout();
              }}
            >
              {t("common.sign_out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
