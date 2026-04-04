import { FileText, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/PageShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { OrderPipeline } from "@/components/dashboard/OrderPipeline";

const activeRfqs = [
  { id: 'RFQ-0421', title: 'Steel Rebar - Grade 60', site: 'Riyadh Villa', bids: 3, date: '2d ago', status: 'OPEN' },
  { id: 'RFQ-0422', title: 'Portland Cement - Type I', site: 'Jeddah Tower', bids: 5, date: '1d ago', status: 'OPEN' },
  { id: 'RFQ-0423', title: 'Electrical Wiring - Copper', site: 'Dammam Port', bids: 1, date: '4h ago', status: 'OPEN' },
  { id: 'RFQ-0424', title: 'HVAC Units - 5 Ton', site: 'Riyadh Villa', bids: 0, date: '1h ago', status: 'OPEN' },
  { id: 'RFQ-0425', title: 'Ceramic Tiles - 60x60', site: 'Neom Base', bids: 8, date: '3d ago', status: 'OPEN' },
];

export default function Index() {
  return (
    <AppLayout>
      <PageShell 
        title="Dashboard" 
        subtitle="Overview of your procurement operations and active orders."
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard 
              title="Active Orders" 
              value="142" 
              trend={12} 
              previousValue="127" 
              icon={<ShoppingCart className="w-4 h-4" />} 
              sparklineData={[110, 115, 120, 122, 118, 130, 142]} 
            />
            <KPICard 
              title="Open RFQs" 
              value="45" 
              trend={-5} 
              previousValue="48" 
              icon={<FileText className="w-4 h-4" />} 
              sparklineData={[50, 48, 49, 45, 46, 44, 45]} 
            />
            <KPICard 
              title="Pending Invoices" 
              value="SAR 2.4M" 
              trend={8} 
              previousValue="SAR 2.2M" 
              icon={<TrendingUp className="w-4 h-4" />} 
              sparklineData={[1.8, 1.9, 2.0, 2.1, 2.3, 2.4, 2.4]} 
            />
            <KPICard 
              title="Delivered This Month" 
              value="3,240" 
              trend={24} 
              previousValue="2,610" 
              icon={<Package className="w-4 h-4" />} 
              sparklineData={[1000, 1200, 1500, 1800, 2400, 2900, 3240]} 
            />
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-surface border border-border rounded-md flex flex-col">
              <div className="px-6 py-5 border-b border-border-2 flex justify-between items-center">
                <h3 className="text-[13px] font-display text-text-1 uppercase tracking-wider">Active RFQs</h3>
                <span className="text-[12px] text-amber cursor-pointer hover:underline">View All</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ ID</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRfqs.map((rfq) => (
                    <TableRow key={rfq.id}>
                      <TableCell className="font-mono text-text-1">{rfq.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-text-1 font-medium">{rfq.title}</span>
                          <span className="text-[11px] text-text-3 mt-0.5">{rfq.site} · {rfq.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-text-1">{rfq.bids}</TableCell>
                      <TableCell>
                        <Badge status={rfq.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>
          </div>

          <div className="w-full">
            <OrderPipeline />
          </div>
        </div>
      </PageShell>
    </AppLayout>
  );
}
