import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "debit" | "credit";
  description: string;
  orderId?: string;
  invoiceId?: string;
  amount: number;
  balance: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface WalletLedgerProps {
  companyName: string;
  totalSpent: number;
  outstandingDues: number;
  transactions: Transaction[];
  className?: string;
}

// FR-E04: Wallet Ledger Component
export function WalletLedger({
  companyName,
  totalSpent,
  outstandingDues,
  transactions,
  className,
}: WalletLedgerProps) {
  const [periodFilter, setPeriodFilter] = useState("all");

  const filteredTransactions = transactions.filter((t) => {
    if (periodFilter === "all") return true;
    const txDate = new Date(t.date);
    const now = new Date();
    if (periodFilter === "30d") {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      return txDate >= thirtyDaysAgo;
    }
    if (periodFilter === "90d") {
      const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
      return txDate >= ninetyDaysAgo;
    }
    return true;
  });

  const totalCredits = filteredTransactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = filteredTransactions
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Wallet & Ledger</h2>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 me-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            SAR {totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Outstanding</span>
          </div>
          <p className={cn(
            "text-2xl font-bold tabular-nums",
            outstandingDues > 0 ? "text-warning" : "text-success"
          )}>
            SAR {outstandingDues.toLocaleString()}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-success mb-2">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Credits (Period)</span>
          </div>
          <p className="text-2xl font-bold text-success tabular-nums">
            SAR {totalCredits.toLocaleString()}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-danger mb-2">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Debits (Period)</span>
          </div>
          <p className="text-2xl font-bold text-danger tabular-nums">
            SAR {totalDebits.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-3 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-start p-3 text-sm font-medium text-muted-foreground">Description</th>
                <th className="text-start p-3 text-sm font-medium text-muted-foreground">Reference</th>
                <th className="text-end p-3 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-end p-3 text-sm font-medium text-muted-foreground">Balance</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <tr
                  key={tx.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="p-3 text-sm tabular-nums">{tx.date}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {tx.type === "credit" ? (
                        <ArrowDownRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-danger" />
                      )}
                      <span className="text-sm font-medium">{tx.description}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {tx.orderId || tx.invoiceId || "-"}
                  </td>
                  <td className={cn(
                    "p-3 text-sm text-end tabular-nums font-medium",
                    tx.type === "credit" ? "text-success" : "text-danger"
                  )}>
                    {tx.type === "credit" ? "+" : "-"} SAR {tx.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-sm text-end tabular-nums font-medium">
                    SAR {tx.balance.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge
                      variant={
                        tx.status === "completed"
                          ? "success"
                          : tx.status === "pending"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                    >
                      {tx.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground">
              Transactions will appear here once you place orders
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
