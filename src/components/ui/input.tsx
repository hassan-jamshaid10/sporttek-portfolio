import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-sm font-medium text-[#17354F] placeholder:text-neutral-400 outline-none transition focus-visible:border-[#65AA2B]/55 focus-visible:ring-2 focus-visible:ring-[#65AA2B]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
