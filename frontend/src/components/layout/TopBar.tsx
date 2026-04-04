import { Search, RefreshCw, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useSync } from "@/contexts/SyncContext";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { sync, isSyncing } = useSync();
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);
  const pageTitle = pathnames.length > 0 
    ? pathnames[pathnames.length - 1].charAt(0).toUpperCase() + pathnames[pathnames.length - 1].slice(1)
    : "Dashboard";

  return (
    <header className="h-[52px] bg-ground/80 backdrop-blur-[8px] border-b border-border px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
      
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 text-[12px] text-text-3 font-body">
          <span>Home</span>
          {pathnames.length > 0 && <ChevronRight className="w-3 h-3" />}
          {pathnames.slice(0, -1).map((val, index) => (
            <span key={index} className="flex items-center gap-2">
              <span>{val.charAt(0).toUpperCase() + val.slice(1)}</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          ))}
        </div>
        <h2 className="text-[16px] font-display text-text-1 leading-none pt-1">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative w-[280px]">
          <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-text-3" />
          <Input
            placeholder="Search everything..."
            className="h-8 pl-9 pr-12 bg-surface-2 border-border-2 text-[13px]"
          />
          <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center bg-surface border border-border-2 rounded px-1.5 h-5 text-[10px] text-text-3 font-mono">
            ⌘K
          </div>
        </div>

        <NotificationBell />

        <button
          onClick={sync}
          disabled={isSyncing}
          className={cn(
            "flex items-center justify-center text-text-3 hover:text-amber transition-colors w-8 h-8 rounded hover:bg-amber-glow",
            isSyncing && "animate-spin text-amber"
          )}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
