import { AppLayout } from "@/components/layout/AppLayout";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export default function AuditLogsPage() {
  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Track mutating API actions across entities.
          </p>
        </div>
        <AuditLogViewer />
      </div>
    </AppLayout>
  );
}
