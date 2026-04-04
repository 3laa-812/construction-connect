import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  trend: number;
  previousValue: string | number;
  icon: ReactNode;
  sparklineData: number[];
}

export function KPICard({ title, value, trend, previousValue, icon, sparklineData }: KPICardProps) {
  const isPositive = trend >= 0;
  
  const max = Math.max(...sparklineData, 1);
  const min = Math.min(...sparklineData, 0);
  const range = max - min;
  
  const points = sparklineData.map((d, i) => {
    const x = (i / (sparklineData.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-surface border border-border rounded-md p-5 flex flex-col gap-4 transition-colors hover:border-border-2">
      <div className="flex justify-between items-start">
        <div className="w-8 h-8 rounded bg-surface-2 flex items-center justify-center text-text-2">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${isPositive ? 'text-success bg-success/10' : 'text-[#8B2E2E] bg-[#8B2E2E]/10'}`}>
          {isPositive ? '+' : ''}{trend}% {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        </div>
      </div>
      
      <div className="flex flex-col">
        <span className="font-mono text-[36px] text-text-1 leading-none mb-1">{value}</span>
        <span className="text-[11px] uppercase tracking-wider text-text-3 font-medium">{title}</span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <svg className="w-full h-[40px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polyline
            points={points}
            fill="none"
            stroke="var(--amber)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="vector-non-scaling-stroke drop-shadow-[0_2px_4px_rgba(212,146,10,0.3)]"
          />
        </svg>
        <span className="text-[11px] text-text-3">vs {previousValue} last week</span>
      </div>
    </div>
  );
}
