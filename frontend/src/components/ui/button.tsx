import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-[120ms] ease-out-expo cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
  {
    variants: {
      variant: {
        primary: "bg-amber text-ground hover:bg-[#E0A020] active:scale-[0.98] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]",
        secondary: "bg-surface-2 text-text-1 border border-border-2 hover:border-amber/40 hover:bg-[#1F2420] active:scale-[0.98]",
        ghost: "text-text-2 hover:text-text-1 hover:bg-surface-2 active:scale-[0.98]",
        danger: "bg-[#8B2E2E] text-[#F0EDE8] hover:bg-[#A03535] active:scale-[0.98]",
        outline: "border border-amber/40 text-amber hover:bg-amber-glow active:scale-[0.98]",
        // Legacy compat
        default: "bg-amber text-ground hover:bg-[#E0A020] active:scale-[0.98] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]",
        destructive: "bg-[#8B2E2E] text-[#F0EDE8] hover:bg-[#A03535] active:scale-[0.98]",
        link: "text-amber underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7 px-3 text-xs rounded-sm",
        md: "h-9 px-4 text-sm rounded",
        lg: "h-11 px-6 text-sm rounded-md",
        // Legacy compat
        default: "h-9 px-4 text-sm rounded",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
