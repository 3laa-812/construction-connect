import { FileText, Package, TrendingUp, CheckCircle, Clock, Truck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "rfq" | "bid" | "order" | "delivery";
  title: string;
  description: string;
  time: string;
  status?: "success" | "warning" | "neutral";
}

const activities: Activity[] = [
  {
    id: "1",
    type: "bid",
    title: "New bid received",
    description: "Ezz Steel submitted bid for RFQ-2024-0162",
    time: "5 min ago",
    status: "success",
  },
  {
    id: "2",
    type: "order",
    title: "Order confirmed",
    description: "ORD-2024-0845 confirmed by Saudi Ceramics",
    time: "32 min ago",
    status: "success",
  },
  {
    id: "3",
    type: "delivery",
    title: "Out for delivery",
    description: "ORD-2024-0839 - Portland Cement Type I",
    time: "1 hour ago",
    status: "warning",
  },
  {
    id: "4",
    type: "rfq",
    title: "RFQ closing soon",
    description: "RFQ-2024-0158 closes in 2 hours",
    time: "2 hours ago",
    status: "warning",
  },
  {
    id: "5",
    type: "delivery",
    title: "Delivery completed",
    description: "ORD-2024-0832 delivered to Al-Faisaliah Tower site",
    time: "3 hours ago",
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
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
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
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">{activity.time}</span>
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
