import { FileText, Package, TrendingUp, CheckCircle, Clock, Truck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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

const activities: Activity[] = [
  {
    id: "1",
    type: "bid",
    title: "dashboard.activities.new_bid.title",
    titleAr: "",
    description: "dashboard.activities.new_bid.desc",
    descriptionAr: "",
    time: "dashboard.time.min_ago",
    timeAr: "",
    timeVal: 5,
    status: "success",
  },
  {
    id: "2",
    type: "order",
    title: "dashboard.activities.order_confirmed.title",
    titleAr: "",
    description: "dashboard.activities.order_confirmed.desc",
    descriptionAr: "",
    time: "dashboard.time.min_ago",
    timeAr: "",
    timeVal: 32,
    status: "success",
  },
  {
    id: "3",
    type: "delivery",
    title: "dashboard.activities.out_for_delivery.title",
    titleAr: "",
    description: "dashboard.activities.out_for_delivery.desc",
    descriptionAr: "",
    time: "dashboard.time.hour_ago",
    timeAr: "",
    timeVal: 1,
    status: "warning",
  },
  {
    id: "4",
    type: "rfq",
    title: "dashboard.activities.rfq_closing.title",
    titleAr: "",
    description: "dashboard.activities.rfq_closing.desc",
    descriptionAr: "",
    time: "dashboard.time.hours_ago",
    timeAr: "",
    timeVal: 2,
    status: "warning",
  },
  {
    id: "5",
    type: "delivery",
    title: "dashboard.activities.delivery_completed.title",
    titleAr: "",
    description: "dashboard.activities.delivery_completed.desc",
    descriptionAr: "",
    time: "dashboard.time.hours_ago",
    timeAr: "",
    timeVal: 3,
    status: "success",
  },
];

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
  const { isRTL, t } = useLanguage();

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
