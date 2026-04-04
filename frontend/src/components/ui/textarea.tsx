import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-border-2 bg-surface-2 px-3 py-2 text-sm font-body text-text-1 placeholder:text-text-3 focus-visible:outline-none focus-visible:border-amber focus-visible:shadow-[0_0_0_3px_var(--amber-glow)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y",
          error && "border-[#8B2E2E] focus-visible:border-[#8B2E2E] focus-visible:shadow-[0_0_0_3px_rgba(139,46,46,0.15)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
