"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer shrink-0 border shadow-xs transition-all duration-200 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:scale-105",
  {
    variants: {
      variant: {
        default: "border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        black: "border-gray-300 bg-white data-[state=checked]:bg-black data-[state=checked]:text-white data-[state=checked]:border-black focus-visible:border-black focus-visible:ring-black/20 hover:border-gray-400 data-[state=checked]:hover:bg-gray-800",
        outline: "border-2 border-gray-300 bg-transparent data-[state=checked]:bg-transparent data-[state=checked]:text-black data-[state=checked]:border-black focus-visible:border-black focus-visible:ring-black/20 hover:border-gray-400",
        success: "border-green-300 bg-white data-[state=checked]:bg-green-600 data-[state=checked]:text-white data-[state=checked]:border-green-600 focus-visible:border-green-500 focus-visible:ring-green-500/20",
        destructive: "border-red-300 bg-white data-[state=checked]:bg-red-600 data-[state=checked]:text-white data-[state=checked]:border-red-600 focus-visible:border-red-500 focus-visible:ring-red-500/20",
      },
      size: {
        sm: "size-3 rounded-[3px]",
        default: "size-4 rounded-[4px]",
        lg: "size-5 rounded-[5px]",
        xl: "size-6 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const checkboxIndicatorVariants = cva(
  "flex items-center justify-center text-current transition-all duration-200",
  {
    variants: {
      size: {
        sm: "[&>svg]:size-2.5",
        default: "[&>svg]:size-3.5",
        lg: "[&>svg]:size-4",
        xl: "[&>svg]:size-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface CheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

function Checkbox({
  className,
  variant,
  size,
  ...props
}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ variant, size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(checkboxIndicatorVariants({ size }))}
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, checkboxVariants }