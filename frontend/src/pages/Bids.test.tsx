import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Bids from "./Bids";

const mockGet = vi.fn();
const mockPatch = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
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

vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

describe("Bids", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      data: [
        {
          id: "rfq-1",
          items: [{ product_name: "Steel" }],
          bids: [
            {
              id: "bid-99",
              status: "PENDING",
              supplier: { name: "Acme Supply" },
              items: [{ unit_price: 5 }],
              total_price: 500,
              valid_until: new Date(Date.now() + 86400000 * 3).toISOString(),
            },
          ],
        },
      ],
    });
    mockPatch.mockResolvedValue({ data: {} });
  });

  function renderPage() {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Bids />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("calls PATCH reject with rejection_reason when confirm reject is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.queryByText("Loading bids...")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "common.reject" }));

    const dialog = await screen.findByRole("dialog");
    const combo = within(dialog).getByRole("combobox");
    await user.click(combo);
    await user.click(
      await screen.findByRole("option", {
        name: "bids.dialog.reasons.price_high",
      }),
    );

    await user.click(
      within(dialog).getByRole("button", { name: "bids.dialog.confirm_reject" }),
    );

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        "/rfqs/rfq-1/bids/bid-99/reject",
        { rejection_reason: "Price too high" },
      );
    });
  });
});
