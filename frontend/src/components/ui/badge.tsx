import * as React from "react"
import { cn } from "@/lib/utils"

const statusMap = {
  OPEN:             { label: 'Open',           dot: '#D4920A', bg: 'rgba(212,146,10,0.12)',  text: '#D4920A'  },
  CONFIRMED:        { label: 'Confirmed',       dot: '#2E5A8B', bg: 'rgba(46,90,139,0.12)',   text: '#6B9DD4'  },
  PROCESSING:       { label: 'Processing',      dot: '#B87333', bg: 'rgba(184,115,51,0.12)',  text: '#D4924A'  },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',dot: '#8A6BBF', bg: 'rgba(138,107,191,0.12)', text: '#A98FD4'  },
  DELIVERED:        { label: 'Delivered',       dot: '#2D7A4F', bg: 'rgba(45,122,79,0.12)',   text: '#4CAF7A'  },
  COMPLETED:        { label: 'Completed',       dot: '#2D7A4F', bg: 'rgba(45,122,79,0.08)',   text: '#4CAF7A'  },
  AWARDED:          { label: 'Awarded',         dot: '#D4920A', bg: 'rgba(212,146,10,0.12)',  text: '#D4920A'  },
  REJECTED:         { label: 'Rejected',        dot: '#8B2E2E', bg: 'rgba(139,46,46,0.12)',   text: '#C45A5A'  },
  PENDING:          { label: 'Pending KYB',     dot: '#9A9890', bg: 'rgba(154,152,144,0.12)', text: '#9A9890'  },
};

export type StatusType = keyof typeof statusMap;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  status?: StatusType | string;
}

function Badge({ className, status, children, variant, ...props }: BadgeProps) {
  if (status && statusMap[status as StatusType]) {
    const config = statusMap[status as StatusType];
    const isPulsing = ['OPEN', 'PROCESSING', 'OUT_FOR_DELIVERY'].includes(status as string);
    return (
      <div
        className={cn(
          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border border-transparent",
          className
        )}
        style={{ backgroundColor: config.bg, color: config.text }}
        {...props}
      >
        <div className="relative flex h-2 w-2 mr-1.5 items-center justify-center">
          {isPulsing && (
            <span 
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: config.dot }} 
            />
          )}
          <span 
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ backgroundColor: config.dot }} 
          />
        </div>
        {config.label}
      </div>
    )
  }

  // Fallback for simple badges
  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold bg-surface-2 text-text-1 border border-border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Badge, statusMap }
