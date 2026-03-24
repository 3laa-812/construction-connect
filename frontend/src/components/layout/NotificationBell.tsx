import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  entity_id?: string | null;
  is_read: boolean;
  created_at: string;
};

function hrefForNotification(n: AppNotification): string {
  switch (n.type) {
    case "rfq_awarded":
      return n.entity_id ? `/orders?created=${n.entity_id}` : "/orders";
    case "bid_received":
      return "/rfqs";
    case "order_status":
      return "/orders";
    case "kyb_approved":
      return "/settings";
    default:
      return "/";
  }
}

export function NotificationBell() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadList = [], isLoading } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const res = await api.get<AppNotification[]>("/notifications", {
        params: { unread: "true", limit: 30 },
      });
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const unreadCount = unreadList.length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/mark-read/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post("/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const items = useMemo(() => unreadList.slice(0, 15), [unreadList]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-danger text-[10px] font-semibold text-white flex items-center justify-center",
                isRTL ? "-left-0.5" : "-right-0.5"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>{t("common.notifications")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              {t("notifications.mark_all_read")}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            {t("notifications.empty")}
          </div>
        )}
        {items.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="flex flex-col items-start gap-1 py-3 cursor-pointer"
            onClick={() => {
              const href = hrefForNotification(n);
              markReadMutation.mutate(n.id);
              navigate(href);
            }}
          >
            <span className="text-sm font-medium">{n.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {n.body}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(n.created_at).toLocaleString()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
