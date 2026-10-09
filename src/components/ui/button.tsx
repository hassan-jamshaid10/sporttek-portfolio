import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65AA2B]/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#65AA2B] text-[#071018] hover:bg-[#5a9826]",
        outline:
          "border border-black/10 bg-white text-[#17354F] hover:bg-neutral-50 dark:border-white/15 dark:bg-[#17354F] dark:text-white dark:hover:bg-[#1f4463]",
        ghost: "text-[#17354F] hover:bg-neutral-100 dark:text-white dark:hover:bg-white/10",
        secondary:
          "bg-neutral-100 text-[#17354F] hover:bg-neutral-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
      },
      size: {
        default: "h-11 rounded-full px-5 text-sm",
        sm: "h-9 rounded-full px-3.5 text-sm",
        icon: "h-10 w-10 rounded-full",
        lg: "h-12 rounded-full px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
