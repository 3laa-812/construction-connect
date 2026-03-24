import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoodsReceivedNote } from "./GoodsReceivedNote";

const mockPost = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (k: string) => k,
    language: "en" as const,
    isRTL: false,
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

describe("GoodsReceivedNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: {} });
  });

  it("POSTs /purchase-orders/:id/delivery-notes on confirm", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <GoodsReceivedNote
        orderId="po-123"
        supplier="Supplier Co"
        lineItems={[
          {
            id: "poi-1",
            productName: "Cement",
            quantity: 10,
            unit: "bags",
          },
        ]}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "orders.grn.actions.next_photos" }),
    );
    await user.click(
      screen.getByRole("button", { name: "orders.grn.actions.next_sign" }),
    );

    await user.type(screen.getByPlaceholderText("Full name"), "Site Receiver");
    await user.type(
      screen.getByPlaceholderText("+966 5X XXX XXXX"),
      "+966500000001",
    );

    await user.click(
      screen.getByRole("button", { name: "orders.grn.actions.confirm" }),
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/purchase-orders/po-123/delivery-notes",
        {
          status: "DELIVERED",
          items: [{ po_item_id: "poi-1", delivered_qty: 10 }],
        },
      );
    });
    expect(onConfirm).toHaveBeenCalled();
  });
});
