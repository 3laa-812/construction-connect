import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, FileText, Clock, CheckCircle, XCircle, Eye, MoreHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
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

interface RFQ {
  id: string;
  title: string;
  project: string;
  category: string;
  items: number;
  bidsReceived: number;
  status: "open" | "closed" | "awarded" | "cancelled";
  deadline: string;
  createdAt: string;
  totalValue?: number;
}

const mockRFQs: RFQ[] = [
  {
    id: "RFQ-2024-0162",
    title: "Portland Cement Type I - 5000 Bags",
    project: "King Abdullah Financial District - Phase 3",
    category: "Building Materials",
    items: 3,
    bidsReceived: 4,
    status: "open",
    deadline: "2024-02-20",
    createdAt: "2024-01-15",
    totalValue: 225000,
  },
  {
    id: "RFQ-2024-0161",
    title: "Structural Steel Beams H-Section",
    project: "Riyadh Metro Station Finishing",
    category: "Steel & Metal",
    items: 8,
    bidsReceived: 6,
    status: "open",
    deadline: "2024-02-18",
    createdAt: "2024-01-14",
    totalValue: 890000,
  },
  {
    id: "RFQ-2024-0160",
    title: "Electrical Cables and Conduits",
    project: "Al-Faisaliah Tower Renovation",
    category: "Electrical",
    items: 12,
    bidsReceived: 3,
    status: "awarded",
    deadline: "2024-02-10",
    createdAt: "2024-01-10",
    totalValue: 156000,
  },
  {
    id: "RFQ-2024-0159",
    title: "PVC Pipes and Fittings",
    project: "Jeddah Waterfront Development",
    category: "Plumbing",
    items: 15,
    bidsReceived: 5,
    status: "closed",
    deadline: "2024-02-05",
    createdAt: "2024-01-08",
    totalValue: 78000,
  },
  {
    id: "RFQ-2024-0158",
    title: "HVAC Units - Central Air Conditioning",
    project: "King Abdullah Financial District - Phase 3",
    category: "HVAC",
    items: 6,
    bidsReceived: 2,
    status: "open",
    deadline: "2024-02-25",
    createdAt: "2024-01-18",
    totalValue: 450000,
  },
  {
    id: "RFQ-2024-0157",
    title: "Ceramic Floor Tiles - Grade A",
    project: "Al-Faisaliah Tower Renovation",
    category: "Finishing Materials",
    items: 4,
    bidsReceived: 0,
    status: "cancelled",
    deadline: "2024-01-30",
    createdAt: "2024-01-05",
  },
];

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

  const filteredRFQs = mockRFQs.filter((rfq) => {
    const matchesSearch =
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || rfq.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(mockRFQs.map((r) => r.category))];

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
            <table className="w-full data-grid">
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
                        {rfq.status === "open" && (
                          <p className="text-xs text-muted-foreground">
                            {Math.ceil((new Date(rfq.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} {t("rfq.days_left")}
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
          </div>

          {filteredRFQs.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-foreground">{t("rfq.no_results")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("rfq.no_results_desc")}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
