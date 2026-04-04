import { ReactNode } from "react";

interface Activity {
  id: string;
  type: 'rfq' | 'delivery' | 'team' | 'invoice';
  message: ReactNode;
  time: string;
}

const mockActivities: Activity[] = [
  { id: '1', type: 'rfq', message: <>RFQ <span className="text-amber">#4421</span> received 3 bids</>, time: '2h ago' },
  { id: '2', type: 'delivery', message: <>Order <span className="text-amber">#PO-0089</span> marked Delivered</>, time: '5h ago' },
  { id: '3', type: 'team', message: <>Ahmed Al-Rashidi joined the team</>, time: 'Yesterday' },
  { id: '4', type: 'invoice', message: <>Invoice <span className="text-amber">#INV-0044</span> auto-generated</>, time: 'Yesterday' },
];

export function ActivityFeed() {
  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'rfq': return 'var(--amber)';
      case 'delivery': return 'var(--success)';
      case 'team': return 'var(--info)';
      case 'invoice': return 'var(--text-3)';
      default: return 'var(--text-3)';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-md p-6 h-full flex flex-col">
      <h3 className="text-[13px] font-display text-text-1 mb-6 uppercase tracking-wider">Recent Activity</h3>
      <div className="flex flex-col relative flex-1">
        <div className="absolute left-[3px] top-2 bottom-2 w-px bg-border-2 z-0" />
        
        {mockActivities.map((act) => (
          <div key={act.id} className="relative z-10 flex gap-4 mb-6 last:mb-0">
            <div 
              className="w-[7px] h-[7px] rounded-full shrink-0 mt-1.5 ring-4 ring-surface" 
              style={{ backgroundColor: getTypeColor(act.type) }} 
            />
            <div className="flex flex-col flex-1">
              <span className="text-[14px] text-text-1 font-body leading-tight mt-[1px]">{act.message}</span>
            </div>
            <span className="text-[11px] text-text-3 whitespace-nowrap pt-[2px]">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
