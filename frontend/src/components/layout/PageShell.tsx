import { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-6 font-body">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[24px] text-text-1 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-text-2 max-w-[480px] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
