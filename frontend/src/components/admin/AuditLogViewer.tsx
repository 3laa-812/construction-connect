import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChevronDown, ChevronRight, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type AuditLog = {
  id: string;
  user_id: string;
  company_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  ip_address?: string | null;
  details?: Record<string, any>; // Add mock details
};

type AuditLogsResponse = {
  items: AuditLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function getActionColor(action: string): "primary" | "warning" | "danger" | "success" | "neutral" {
  const upper = action.toUpperCase();
  if (upper.includes("CREATE") || upper.includes("ADD")) return "success";
  if (upper.includes("UPDATE") || upper.includes("EDIT")) return "warning";
  if (upper.includes("DELETE") || upper.includes("REMOVE")) return "danger";
  return "neutral";
}

export function AuditLogViewer() {
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const queryKey = useMemo(
    () => ["admin", "audit-logs", { entityType, from, to, page }],
    [entityType, from, to, page],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (entityType.trim()) params.entity_type = entityType.trim();
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.get("/admin/audit-logs", { params });
      return res.data as AuditLogsResponse;
    },
  });

  const generateMockDetails = (log: AuditLog) => {
    return {
      previous_state: { status: "DRAFT" },
      new_state: { status: "ISSUED" },
      changed_fields: ["status"],
      request_id: `req_${Math.random().toString(36).substring(7)}`,
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    };
  };

  const logs = data?.items || [];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-surface rounded-md border border-border p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 w-full flex-wrap gap-4 items-center">
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Entity (e.g. PURCHASE_ORDER)"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="h-9 w-auto"
            />
            <span className="text-text-3 text-sm">to</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="h-9 w-auto"
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEntityType("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
          className="shrink-0 h-9 whitespace-nowrap"
        >
          Clear Filters
        </Button>
      </div>

      {/* Full Width Table */}
      <div className="bg-surface rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th className="p-3 w-10"></th>
                <th className="p-3 text-xs font-medium text-text-3 uppercase tracking-wider">Timestamp</th>
                <th className="p-3 text-xs font-medium text-text-3 uppercase tracking-wider">User</th>
                <th className="p-3 text-xs font-medium text-text-3 uppercase tracking-wider">Action</th>
                <th className="p-3 text-xs font-medium text-text-3 uppercase tracking-wider">Entity</th>
                <th className="p-3 text-xs font-medium text-text-3 uppercase tracking-wider text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-3">Loading audit logs...</td>
                </tr>
              )}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-3">No logs found matching your filters.</td>
                </tr>
              )}
              {logs.map((log) => {
                const isExpanded = expandedRow === log.id;
                const dateObj = new Date(log.created_at);
                const shortId = log.user_id.substring(0, 8);
                const userName = `User-${shortId}`;
                const mockDetails = generateMockDetails(log);

                return (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={cn("hover:bg-surface-2 transition-colors cursor-pointer", isExpanded && "bg-surface-2")}
                      onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                    >
                      <td className="p-3 text-center">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-text-3 mx-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-3 mx-auto" />
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[13px] text-text-2">
                          {dateObj.toISOString().replace("T", " ").substring(0, 19)}
                        </span>
                      </td>
                      <td className="p-3">
                        {/* User Pill */}
                        <div className="flex items-center gap-2 inline-flex bg-white/5 border border-border px-2 py-1 rounded-full">
                          <div className="w-5 h-5 rounded-full bg-amber/20 text-amber flex items-center justify-center text-[10px] font-bold">
                            {userName.charAt(0)}
                          </div>
                          <span className="text-[12px] font-medium text-text-1 pr-1">{userName}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusBadge variant={getActionColor(log.action)} size="sm" className="font-mono text-[10px]">
                          {log.action.toUpperCase()}
                        </StatusBadge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-text-2">{log.entity_type}</span>
                          <span className="text-[12px] font-mono text-text-3 cursor-alias hover:text-amber transition-colors">#{log.entity_id.substring(0, 8)}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono text-[12px] text-text-3">{log.ip_address || "127.0.0.1"}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#0A0A0A]">
                        <td colSpan={6} className="p-0">
                          <div className="p-4 pl-14 border-t border-border/50">
                            <pre className="text-[11px] font-mono text-text-3 overflow-x-auto p-4 bg-black/40 rounded-md border border-white/5">
                              {JSON.stringify(mockDetails, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-3 border-t border-border bg-surface-2 flex items-center justify-between">
          <p className="text-[13px] text-text-3 font-mono">
            Total Records: {data?.total || 0}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              disabled={(data?.page || 1) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              disabled={(data?.page || 1) >= (data?.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
