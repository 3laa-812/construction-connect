import { Check } from "lucide-react";

export function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
    { key: "completed", label: "Completed" },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStatus.toLowerCase());
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-center w-full min-w-max">
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Connecting Line (except for the first one) */}
            {index > 0 && (
              <div className={`w-8 md:w-16 h-[2px] mx-2 transition-colors ${isCompleted || isActive ? 'bg-amber' : 'bg-border-2'}`} />
            )}

            {/* Node */}
            <div className={`flex items-center gap-2 group cursor-pointer`}>
              {isCompleted ? (
                <div className="w-5 h-5 rounded-full bg-[#2D7A4F] text-ground flex items-center justify-center">
                   <Check className="w-3 h-3 stroke-[3px]" />
                </div>
              ) : isActive ? (
                <div className="relative flex items-center justify-center">
                   <div className="absolute w-6 h-6 rounded-full bg-amber-glow animate-pulse" />
                   <div className="w-5 h-5 rounded-full bg-amber border border-amber/20" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface border-2 border-border-2" />
              )}
              
              <span className={`text-[13px] font-medium transition-colors ${
                isCompleted ? 'text-success' : isActive ? 'text-text-1' : 'text-text-3'
              }`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
