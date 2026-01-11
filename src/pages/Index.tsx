import { FileText, ShoppingCart, TrendingUp, Package, Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { BidComparisonTable } from "@/components/bids/BidComparisonTable";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { KYBApprovalCard } from "@/components/admin/KYBApprovalCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const stats = [
    {
      title: t("dashboard.active_rfqs"),
      value: 12,
      change: { value: 8, type: "increase" as const },
      icon: FileText,
      iconColor: "primary" as const,
    },
    {
      title: t("dashboard.pending_orders"),
      value: 47,
      change: { value: 12, type: "increase" as const },
      icon: TrendingUp,
      iconColor: "success" as const,
    },
    {
      title: t("dashboard.orders_this_month"),
      value: 156,
      change: { value: 5, type: "decrease" as const },
      icon: ShoppingCart,
      iconColor: "accent" as const,
    },
    {
      title: t("dashboard.deliveries_pending"),
      value: 23,
      icon: Package,
      iconColor: "warning" as const,
    },
  ];

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.welcome_message", { name: "Ahmed" })}
            </p>
          </div>
          <Link to="/rfqs/new">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 me-2" />
              {t("dashboard.create_new_rfq_action")}
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Activity */}
          <div className="lg:col-span-1 space-y-6">
            <RecentActivity />
          </div>

          {/* Right Column - Key Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bid Comparison */}
            <BidComparisonTable />

            {/* Order Timeline */}
            <OrderTimeline orderId="ORD-2024-0845" currentStatus="out_for_delivery" />
          </div>
        </div>

        {/* Admin Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <KYBApprovalCard />
          
          {/* Quick Links */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">
              {t("dashboard.quick_actions")}
            </h3>
            <div className="grid gap-3">
              <Link
                to="/rfqs/new"
                className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("dashboard.create_new_rfq_action")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.create_new_rfq_desc")}
                    </p>
                  </div>
                </div>
                <ArrowIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                to="/suppliers"
                className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/10 hover:bg-accent/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("dashboard.manage_suppliers_action")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.manage_suppliers_desc")}
                    </p>
                  </div>
                </div>
                <ArrowIcon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </Link>

              <Link
                to="/orders"
                className="flex items-center justify-between p-4 bg-success/5 rounded-lg border border-success/10 hover:bg-success/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("dashboard.track_orders_action")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.track_orders_desc")}
                    </p>
                  </div>
                </div>
                <ArrowIcon className="w-5 h-5 text-muted-foreground group-hover:text-success transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
