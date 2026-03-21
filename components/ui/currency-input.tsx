"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: string;
  onChange: (value: string) => void;
}

// Helper function to format number with commas
const formatNumberWithCommas = (value: string): string => {
  if (!value) return "";

  // Split into integer and decimal parts
  const parts = value.split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // If there's a decimal part, include it (limit to 2 decimal places)
  if (parts.length > 1) {
    const decimalPart = parts[1].slice(0, 2);
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
};

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, placeholder = "in USD. Example: $2,500,000", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove all non-numeric characters except decimal point
      const inputValue = e.target.value.replace(/[^0-9.]/g, "");

      // Prevent multiple decimal points
      const decimalCount = (inputValue.match(/\./g) || []).length;
      if (decimalCount > 1) return;

      // Store the raw numeric value (without commas)
      onChange(inputValue);
    };

    const handleBlur = () => {
      // Clean up formatting on blur
      if (value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          // Format to 2 decimal places if there's a decimal point
          const hasDecimal = value.includes(".");
          onChange(hasDecimal ? numValue.toFixed(2) : numValue.toString());
        }
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        data-slot="input"
        placeholder={placeholder}
        value={value ? `$${formatNumberWithCommas(value)}` : ""}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          "file:text-foreground placeholder:text-light-text-secondary selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-light-border flex  w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-[48px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
