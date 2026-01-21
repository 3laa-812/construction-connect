import { useMemo } from "react";
import { FileText, Package, TrendingUp, CheckCircle, Clock, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

interface Activity {
  id: string;
  type: "rfq" | "bid" | "order" | "delivery";
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  time: string;
  timeAr: string;
  timeVal?: number;
  status?: "success" | "warning" | "neutral";
}

type ApiRFQ = {
  id: string;
  status?: string;
  deadline?: string | null;
  created_at?: string;
};

type ApiPurchaseOrder = {
  id: string;
  status?: string;
  created_at?: string;
  delivery_notes?: Array<{
    id: string;
    status?: string;
    delivery_date?: string;
  }>;
};

const iconMap = {
  rfq: FileText,
  bid: TrendingUp,
  order: Package,
  delivery: Truck,
};

const iconColorMap = {
  rfq: "bg-primary/10 text-primary",
  bid: "bg-success/10 text-success",
  order: "bg-accent/10 text-accent",
  delivery: "bg-warning/10 text-warning",
};

export function RecentActivity() {
  const { t } = useLanguage();

  const { data: rfqs } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs", "recent-activity"],
    queryFn: async () => (await api.get("/rfqs")).data,
  });

  const { data: purchaseOrders } = useQuery<ApiPurchaseOrder[]>({
    queryKey: ["purchase-orders", "recent-activity"],
    queryFn: async () => (await api.get("/purchase-orders")).data,
  });

  const activities: Activity[] = useMemo(() => {
    const now = Date.now();
    const list: (Activity & { timestamp: number })[] = [];

    (rfqs || []).forEach((rfq) => {
      if (!rfq.created_at) return;
      const createdAt = new Date(rfq.created_at).getTime();
      const minutesAgo = Math.max(1, Math.round((now - createdAt) / (1000 * 60)));

      list.push({
        id: `rfq-${rfq.id}`,
        type: "rfq",
        title: "dashboard.activities.rfq_created.title",
        titleAr: "",
        description: "dashboard.activities.rfq_created.desc",
        descriptionAr: "",
        time: "dashboard.time.min_ago",
        timeAr: "",
        timeVal: minutesAgo,
        status: "neutral",
        timestamp: createdAt,
      });
    });

    (purchaseOrders || []).forEach((po) => {
      if (po.created_at) {
        const createdAt = new Date(po.created_at).getTime();
        const minutesAgo = Math.max(1, Math.round((now - createdAt) / (1000 * 60)));
        list.push({
          id: `po-${po.id}`,
          type: "order",
          title: "dashboard.activities.order_confirmed.title",
          titleAr: "",
          description: "dashboard.activities.order_confirmed.desc",
          descriptionAr: "",
          time: "dashboard.time.min_ago",
          timeAr: "",
          timeVal: minutesAgo,
          status: "success",
          timestamp: createdAt,
        });
      }

      (po.delivery_notes || []).forEach((dn) => {
        if (!dn.delivery_date) return;
        const deliveryAt = new Date(dn.delivery_date).getTime();
        const hoursAgo = Math.max(1, Math.round((now - deliveryAt) / (1000 * 60 * 60)));
        const isDelivered = (dn.status || "").toUpperCase() === "DELIVERED";

        list.push({
          id: `dn-${dn.id}`,
          type: "delivery",
          title: isDelivered
            ? "dashboard.activities.delivery_completed.title"
            : "dashboard.activities.out_for_delivery.title",
          titleAr: "",
          description: isDelivered
            ? "dashboard.activities.delivery_completed.desc"
            : "dashboard.activities.out_for_delivery.desc",
          descriptionAr: "",
          time: hoursAgo === 1 ? "dashboard.time.hour_ago" : "dashboard.time.hours_ago",
          timeAr: "",
          timeVal: hoursAgo,
          status: isDelivered ? "success" : "warning",
          timestamp: deliveryAt,
        });
      });
    });

    return list
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(({ timestamp, ...rest }) => rest);
  }, [rfqs, purchaseOrders]);

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">{t("dashboard.recent_activity")}</h3>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="px-6 py-4 flex items-start gap-4 hover:bg-muted/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconColorMap[activity.type])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t(activity.title)}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {t(activity.description)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {t(activity.time, { count: activity.timeVal })}
                </span>
                {activity.status && (
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    activity.status === "success" && "bg-success",
                    activity.status === "warning" && "bg-warning",
                    activity.status === "neutral" && "bg-muted-foreground"
                  )} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
