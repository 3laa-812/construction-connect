import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, FileText, Clock, CheckCircle, XCircle, Eye, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

type ApiRFQ = {
  id: string;
  project?: { id: string; name: string };
  status?: string;
  deadline?: string;
  created_at?: string;
  payment_terms?: string;
  items?: Array<{
    id: string;
    product_name?: string;
    quantity?: number;
    unit?: string;
  }>;
  bids?: Array<{ id: string }>;
};

const statusConfig = {
  open: { color: "primary", labelKey: "rfq.filter.open", icon: Clock },
  closed: { color: "neutral", labelKey: "rfq.filter.closed", icon: CheckCircle },
  awarded: { color: "success", labelKey: "rfq.filter.awarded", icon: CheckCircle },
  cancelled: { color: "danger", labelKey: "rfq.filter.cancelled", icon: XCircle },
} as const;

export default function RFQs() {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data, isLoading, isError } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const response = await api.get("/rfqs");
      return response.data;
    },
  });

  const rfqs = useMemo(() => {
    if (!data) return [];
    return data.map((rfq) => {
      const firstItem = rfq.items?.[0];
      const normalizedStatus = (rfq.status || "open").toLowerCase() as keyof typeof statusConfig;
      return {
        id: rfq.id,
        title: firstItem?.product_name || "RFQ",
        project: rfq.project?.name || "Unassigned project",
        category: firstItem?.unit || "General",
        items: rfq.items?.length || 0,
        bidsReceived: rfq.bids?.length || 0,
        status: statusConfig[normalizedStatus] ? normalizedStatus : "open",
        deadline: rfq.deadline ? new Date(rfq.deadline).toISOString().split("T")[0] : "—",
        createdAt: rfq.created_at ? new Date(rfq.created_at).toISOString().split("T")[0] : "",
        totalValue: rfq.bids?.[0] ? Number((rfq.bids[0] as any).total_price) : undefined,
      };
    });
  }, [data]);

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesSearch =
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || rfq.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(rfqs.map((r) => r.category))];

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("rfq.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("rfq.subtitle")}
            </p>
          </div>
          <Link to="/rfqs/new">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 me-2" />
              {t("rfq.create_rfq")}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("rfq.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 me-2" />
                  <SelectValue placeholder={t("rfq.filter.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("rfq.filter.all_status")}</SelectItem>
                  <SelectItem value="open">{t("rfq.filter.open")}</SelectItem>
                  <SelectItem value="closed">{t("rfq.filter.closed")}</SelectItem>
                  <SelectItem value="awarded">{t("rfq.filter.awarded")}</SelectItem>
                  <SelectItem value="cancelled">{t("rfq.filter.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("rfq.filter.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("rfq.filter.all_categories")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* RFQ List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <>
              <table className="w-full data-grid hidden lg:table">
                <thead>
                  <tr>
                    <th className="min-w-[280px]">{t("rfq.table.details")}</th>
                    <th className="min-w-[180px]">{t("rfq.table.project")}</th>
                    <th className="min-w-[120px]">{t("rfq.table.category")}</th>
                    <th className="min-w-[100px]">{t("rfq.table.bids")}</th>
                    <th className="min-w-[120px]">{t("rfq.table.deadline")}</th>
                    <th className="min-w-[100px]">{t("rfq.table.status")}</th>
                    <th className="min-w-[100px] text-center">{t("rfq.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                          </div>
                        </div>
                      </td>
                      <td><Skeleton className="h-4 w-[120px]" /></td>
                      <td><Skeleton className="h-6 w-[80px]" /></td>
                      <td><Skeleton className="h-4 w-[60px]" /></td>
                      <td><Skeleton className="h-4 w-[80px]" /></td>
                      <td><Skeleton className="h-6 w-[80px]" /></td>
                      <td><Skeleton className="h-8 w-8 rounded-md mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid lg:hidden gap-4 p-4 border-t border-border mt-[-1px]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              </>
            ) : isError ? (
              <div className="p-8 text-center text-danger">Failed to load RFQs</div>
            ) : filteredRFQs.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={FileText}
                  title={t("rfq.no_results")}
                  description={t("rfq.no_results_desc")}
                />
              </div>
            ) : (
              <>
              <table className="w-full data-grid hidden lg:table">
                <thead>
                  <tr>
                    <th className="min-w-[280px]">{t("rfq.table.details")}</th>
                    <th className="min-w-[180px]">{t("rfq.table.project")}</th>
                    <th className="min-w-[120px]">{t("rfq.table.category")}</th>
                    <th className="min-w-[100px]">{t("rfq.table.bids")}</th>
                    <th className="min-w-[120px]">{t("rfq.table.deadline")}</th>
                    <th className="min-w-[100px]">{t("rfq.table.status")}</th>
                    <th className="min-w-[100px] text-center">{t("rfq.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRFQs.map((rfq, index) => {
                    const StatusIcon = statusConfig[rfq.status].icon;
                    return (
                      <tr
                        key={rfq.id}
                        className="hover:bg-muted/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{rfq.id}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {rfq.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-sm truncate max-w-[160px]">{rfq.project}</p>
                        </td>
                        <td>
                          <StatusBadge variant="neutral" size="sm">
                            {rfq.category}
                          </StatusBadge>
                        </td>
                        <td className="tabular-nums">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rfq.bidsReceived}</span>
                            <span className="text-muted-foreground text-sm">/ {rfq.items} items</span>
                          </div>
                        </td>
                        <td className="tabular-nums">
                          <p className="text-sm">{rfq.deadline}</p>
                          {rfq.status === "open" && rfq.deadline !== "—" && (
                            <p className="text-xs text-muted-foreground">
                              {Math.max(
                                0,
                                Math.ceil((new Date(rfq.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                              )}{" "}
                              {t("rfq.days_left")}
                            </p>
                          )}
                        </td>
                        <td>
                          <StatusBadge
                            variant={statusConfig[rfq.status].color as any}
                            size="sm"
                          >
                            {statusConfig[rfq.status].icon && <StatusIcon className="w-3 h-3" />}
                            {t(statusConfig[rfq.status].labelKey)}
                          </StatusBadge>
                        </td>
                        <td className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 me-2" />
                                {t("rfq.view_details")}
                              </DropdownMenuItem>
                              <DropdownMenuItem>{t("rfq.view_bids")}</DropdownMenuItem>
                              {rfq.status === "open" && (
                                <>
                                  <DropdownMenuItem>{t("rfq.edit")}</DropdownMenuItem>
                                  <DropdownMenuItem className="text-danger">
                                    {t("rfq.cancel")}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="grid lg:hidden gap-4 p-4">
                {filteredRFQs.map((rfq, index) => {
                  const StatusIcon = statusConfig[rfq.status]?.icon;
                  return (
                    <div key={rfq.id} className="bg-card rounded-xl border border-border p-4 space-y-4 shadow-sm animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{rfq.id}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{rfq.title}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mt-2 -me-2 h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="w-4 h-4 me-2" />{t("rfq.view_details")}</DropdownMenuItem>
                            <DropdownMenuItem>{t("rfq.view_bids")}</DropdownMenuItem>
                            {rfq.status === "open" && (
                              <>
                                <DropdownMenuItem>{t("rfq.edit")}</DropdownMenuItem>
                                <DropdownMenuItem className="text-danger">{t("rfq.cancel")}</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">{t("rfq.table.project")}</p>
                          <p className="font-medium truncate">{rfq.project}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{t("rfq.table.category")}</p>
                          <p className="font-medium truncate">{rfq.category}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{t("rfq.table.bids")}</p>
                          <p className="font-medium">{rfq.bidsReceived} / {rfq.items}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{t("rfq.table.deadline")}</p>
                          <p className="font-medium">{rfq.deadline}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-border flex justify-between items-center">
                        <StatusBadge variant={statusConfig[rfq.status]?.color as any} size="sm">
                          {statusConfig[rfq.status]?.icon && <StatusIcon className="w-3 h-3" />}
                          {t(statusConfig[rfq.status]?.labelKey)}
                        </StatusBadge>
                        <Button variant="outline" size="sm">
                          {t("rfq.view_details")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>

          {!isLoading && !isError && filteredRFQs.length === 0 && (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title={t("rfq.no_results")}
                description={t("rfq.no_results_desc")}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
