import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border-2 bg-surface-2 px-3 py-2 text-sm text-text-1 font-body file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-3 focus-visible:outline-none focus-visible:border-amber focus-visible:shadow-[0_0_0_3px_var(--amber-glow)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          error && "border-[#8B2E2E] focus-visible:border-[#8B2E2E] focus-visible:shadow-[0_0_0_3px_rgba(139,46,46,0.15)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
