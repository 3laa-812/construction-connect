# Section 8 Vitest Stub

Target component:
- `frontend/src/components/layout/NotificationBell.tsx`

Planned tests (once Vitest is wired):
1. Polls `GET /notifications` with `unread=true` and `refetchInterval` of 30 seconds.
2. Renders unread count badge when the API returns unread rows.
3. Clicking an item calls `POST /notifications/mark-read/:id` and navigates using the notification `type` / `entity_id` link rules.
4. "Mark all read" calls `POST /notifications/mark-all-read` and invalidates the notifications query.
