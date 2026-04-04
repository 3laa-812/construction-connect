import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/PageShell";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BidComparisonTable } from "@/components/bids/BidComparisonTable";

type RfqRow = {
  id: string;
  status: string;
  project?: { name?: string };
  items?: { product_name?: string }[];
  bids?: unknown[];
  created_at?: string;
  delivery_date_required?: string | null;
  payment_terms?: string | null;
};

export default function RFQs() {
  const [activeTab, setActiveTab] = useState("All");
  const tabs = ["All", "Open", "Awarded", "Closed"];
  const [selectedRfq, setSelectedRfq] = useState<RfqRow | null>(null);

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const res = await api.get<RfqRow[]>("/rfqs");
      return res.data;
    },
  });

  const filteredRfqs = rfqs.filter((r) => {
    if (activeTab === "All") return true;
    return r.status === activeTab.toUpperCase();
  });

  return (
    <AppLayout>
      <PageShell
        title="RFQs"
        actions={
          <Link to="/rfqs/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New RFQ
            </Button>
          </Link>
        }
      >
        <div className="flex bg-surface border border-border rounded-md overflow-hidden min-h-[600px] relative">
          <div
            className={`flex flex-col flex-1 ${selectedRfq ? "hidden md:flex md:max-w-[400px] border-r border-border" : ""}`}
          >
            <div className="flex items-center gap-4 px-4 border-b border-border overflow-x-auto no-scrollbar pt-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-amber text-amber"
                      : "border-transparent text-text-3 hover:text-text-1"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-2 p-4 flex flex-col gap-3">
              {isLoading && (
                <p className="text-[13px] text-text-3">Loading RFQs…</p>
              )}
              {!isLoading &&
                filteredRfqs.map((rfq) => (
                  <button
                    type="button"
                    key={rfq.id}
                    onClick={() => setSelectedRfq(rfq)}
                    className={`text-left bg-surface p-4 rounded-md border cursor-pointer transition-all ${
                      selectedRfq?.id === rfq.id
                        ? "border-amber shadow-[0_0_0_1px_var(--amber)]"
                        : "border-border hover:border-border-2"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[13px] font-mono text-text-1">
                        {rfq.id.slice(0, 8)}…
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-text-2 border border-border">
                        {rfq.status}
                      </span>
                    </div>
                    <h4 className="text-[15px] font-medium text-text-1 mb-1">
                      {rfq.items?.[0]?.product_name ?? "RFQ"}
                    </h4>
                    <div className="text-[12px] text-text-3 flex flex-col gap-1">
                      <span>
                        {rfq.project?.name ?? "Project"} ·{" "}
                        {rfq.bids?.length ?? 0} bids
                      </span>
                      <span>
                        {rfq.delivery_date_required
                          ? `Required: ${new Date(rfq.delivery_date_required).toLocaleDateString()}`
                          : ""}{" "}
                        {rfq.payment_terms ? `· ${rfq.payment_terms}` : ""}
                      </span>
                    </div>
                  </button>
                ))}
              {!isLoading && filteredRfqs.length === 0 && (
                <p className="text-[13px] text-text-3">No RFQs in this tab.</p>
              )}
            </div>
          </div>

          {selectedRfq ? (
            <div className="flex-1 flex flex-col bg-surface overflow-y-auto">
              <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-surface z-10">
                <div>
                  <h2 className="text-[18px] font-display text-text-1">
                    {selectedRfq.items?.[0]?.product_name ?? "RFQ"}
                  </h2>
                  <span className="text-[13px] font-mono text-text-3">
                    {selectedRfq.id}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRfq(null)}
                >
                  <X className="w-5 h-5 text-text-3" />
                </Button>
              </div>
              <div className="p-6">
                <p className="text-text-2 text-[14px] mb-6">
                  Status: {selectedRfq.status}. Project:{" "}
                  {selectedRfq.project?.name ?? "—"}
                </p>
                <div className="mt-4">
                  <h3 className="text-[14px] font-medium mb-4">Compare bids</h3>
                  <BidComparisonTable
                    rfqId={selectedRfq.id}
                    rfqStatus={selectedRfq.status}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-surface text-text-3 text-[14px]">
              Select an RFQ to view details
            </div>
          )}
        </div>
      </PageShell>
    </AppLayout>
  );
}
