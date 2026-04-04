import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BidComparisonTable } from "./BidComparisonTable";

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

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

describe("BidComparisonTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/bids")) {
        return Promise.resolve({
          data: [
            {
              id: "bid-1",
              supplier: { name: "Supplier A" },
              items: [{ unit_price: 10 }],
              total_price: 100,
              valid_until: new Date(Date.now() + 86400000 * 7).toISOString(),
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockPatch.mockResolvedValue({ data: { id: "po-1" } });
  });

  function renderTable() {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <BidComparisonTable rfqId="rfq-1" rfqStatus="OPEN" />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("calls PATCH /rfqs/:id/award/:bidId when award is confirmed", async () => {
    const user = userEvent.setup();
    renderTable();

    await waitFor(() => {
      expect(screen.queryByText("Loading bids...")).not.toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "bids.comparison.actions.award" }),
    );

    await user.click(
      screen.getByRole("button", { name: "bids.comparison.dialog.confirm" }),
    );

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/rfqs/rfq-1/award/bid-1");
    });
    expect(navigate).toHaveBeenCalled();
  });
});
