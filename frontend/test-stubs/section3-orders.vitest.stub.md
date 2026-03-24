# Section 3 Vitest Stub

Target component/page:
- `frontend/src/pages/Orders.tsx`
- `frontend/src/components/orders/GoodsReceivedNote.tsx`

Planned tests (to implement once Vitest is added to this workspace):
1. Renders all PO lifecycle states (`CONFIRMED`, `PROCESSING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `COMPLETED`).
2. Shows GRN action only when selected order status is `OUT_FOR_DELIVERY`.
3. Submitting GRN calls `POST /purchase-orders/:id/delivery-notes` with `items[].po_item_id` and `items[].delivered_qty`.
4. Invalidates `purchase-orders` query after successful GRN submission.
