# Section 7 Vitest Stub

Target component/page:
- `frontend/src/components/admin/AuditLogViewer.tsx`
- `frontend/src/pages/admin/AuditLogs.tsx`

Planned tests (to implement once Vitest is added to this workspace):
1. Fetches `GET /admin/audit-logs` with `page`, `entity_type`, `from`, and `to` query params.
2. Renders table rows for fetched logs with timestamp, user, action, entity, and details.
3. Shows empty state when the endpoint returns zero items.
4. `Previous` and `Next` buttons update `page` state and re-fetch data.
