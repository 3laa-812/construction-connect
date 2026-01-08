import { Check, Clock, Package, Truck, MapPin, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  timestamp?: string;
  status: "completed" | "current" | "pending";
}

interface OrderTimelineProps {
  orderId: string;
  currentStatus: "confirmed" | "processing" | "out_for_delivery" | "delivered" | "completed";
  className?: string;
}

const statusConfig = {
  confirmed: { color: "primary", label: "Confirmed" },
  processing: { color: "warning", label: "Processing" },
  out_for_delivery: { color: "accent", label: "Out for Delivery" },
  delivered: { color: "success", label: "Delivered" },
  completed: { color: "success", label: "Completed" },
} as const;

export function OrderTimeline({ orderId, currentStatus, className }: OrderTimelineProps) {
  const statusOrder = ["confirmed", "processing", "out_for_delivery", "delivered"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  const steps: TimelineStep[] = [
    {
      id: "confirmed",
      title: "Order Confirmed",
      description: "Order has been confirmed by supplier",
      timestamp: "Jan 15, 2024 · 09:30 AM",
      status: currentIndex >= 0 ? (currentIndex === 0 ? "current" : "completed") : "pending",
    },
    {
      id: "processing",
      title: "Processing",
      description: "Order is being prepared for shipment",
      timestamp: currentIndex >= 1 ? "Jan 16, 2024 · 02:15 PM" : undefined,
      status: currentIndex > 0 ? (currentIndex === 1 ? "current" : "completed") : "pending",
    },
    {
      id: "out_for_delivery",
      title: "Out for Delivery",
      description: "Order is on its way to the delivery location",
      timestamp: currentIndex >= 2 ? "Jan 18, 2024 · 07:45 AM" : undefined,
      status: currentIndex > 1 ? (currentIndex === 2 ? "current" : "completed") : "pending",
    },
    {
      id: "delivered",
      title: "Delivered",
      description: "Order has been successfully delivered",
      timestamp: currentIndex >= 3 ? "Jan 18, 2024 · 11:20 AM" : undefined,
      status: currentIndex === 3 ? "current" : "pending",
    },
  ];

  const iconMap = {
    confirmed: Check,
    processing: Package,
    out_for_delivery: Truck,
    delivered: MapPin,
  };

  return (
    <div className={cn("bg-card rounded-xl border border-border", className)}>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Order Status</h3>
          <p className="text-sm text-muted-foreground">{orderId}</p>
        </div>
        <StatusBadge
          variant={statusConfig[currentStatus].color as any}
        >
          {statusConfig[currentStatus].label}
        </StatusBadge>
      </div>

      <div className="p-6">
        {/* Horizontal Timeline - Desktop */}
        <div className="hidden md:block">
          <div className="relative flex items-start justify-between">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
              <div
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, index) => {
              const Icon = iconMap[step.id as keyof typeof iconMap];
              return (
                <div
                  key={step.id}
                  className="relative flex flex-col items-center text-center flex-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all",
                      step.status === "completed" && "bg-success text-success-foreground",
                      step.status === "current" && "bg-primary text-primary-foreground animate-pulse-highlight",
                      step.status === "pending" && "bg-muted text-muted-foreground border-2 border-border"
                    )}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="mt-3">
                    <p className={cn(
                      "font-medium text-sm",
                      step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[140px]">
                      {step.description}
                    </p>
                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                        {step.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical Timeline - Mobile */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => {
            const Icon = iconMap[step.id as keyof typeof iconMap];
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute top-10 left-5 w-0.5 h-[calc(100%+24px)] -translate-x-1/2",
                      step.status === "completed" ? "bg-success" : "bg-border"
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10",
                    step.status === "completed" && "bg-success text-success-foreground",
                    step.status === "current" && "bg-primary text-primary-foreground animate-pulse-highlight",
                    step.status === "pending" && "bg-muted text-muted-foreground border-2 border-border"
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <p className={cn(
                    "font-medium",
                    step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                      {step.timestamp}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
