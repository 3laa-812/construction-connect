import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditLog = {
  id: string;
  user_id: string;
  company_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  ip_address?: string | null;
};

type AuditLogsResponse = {
  items: AuditLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function AuditLogViewer() {
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

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
      return (await api.get("/admin/audit-logs", { params }))
        .data as AuditLogsResponse;
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input
          placeholder="Entity type (RFQ, PURCHASE_ORDERS...)"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
        />
        <Button
          variant="outline"
          onClick={() => {
            setEntityType("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
        >
          Clear Filters
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Loading audit logs...</TableCell>
              </TableRow>
            )}
            {!isLoading && (data?.items?.length || 0) === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No logs found for current filters.</TableCell>
              </TableRow>
            )}
            {(data?.items || []).map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{log.user_id}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  {log.entity_type} #{log.entity_id}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  IP: {log.ip_address || "n/a"} | Company: {log.company_id}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total: {data?.total || 0} logs
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={(data?.page || 1) <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={(data?.page || 1) >= (data?.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
