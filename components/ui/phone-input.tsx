"use client";

import * as React from "react";
import { Input } from "./input";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
}

const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  if (!value) {
    return "";
  }

  const phoneNumber = value?.replace(/\D/g, "");

  // Check if it starts with 1 (US country code)
  const hasCountryCode = phoneNumber?.startsWith("1") && phoneNumber.length > 10;
  const numberToFormat = hasCountryCode ? phoneNumber.slice(1) : phoneNumber;
  const countryCode = hasCountryCode ? "1 " : "";

  // Limit to 10 digits for the main phone number
  const limitedNumber = numberToFormat?.slice(0, 10);

  // Format the number
  if (limitedNumber?.length === 0) {
    return countryCode.trim();
  } else if (limitedNumber?.length <= 3) {
    return `${countryCode}(${limitedNumber}`;
  } else if (limitedNumber.length <= 6) {
    return `${countryCode}(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
  } else {
    return `${countryCode}(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6)}`;
  }
};

const getNumericValue = (value: string): string => {
  return value.replace(/\D/g, "");
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ type = "tel", value = "", onChange, onKeyDown, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(() => formatPhoneNumber(value));
    const [cursorPosition, setCursorPosition] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Update local value when prop value changes
    React.useEffect(() => {
      setLocalValue(formatPhoneNumber(value));
    }, [value]);

    // Restore cursor position after formatting
    React.useEffect(() => {
      if (inputRef.current && cursorPosition !== null) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, [localValue, cursorPosition]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const cursorPos = e.target.selectionStart || 0;

      // Get the numeric value before and after
      const oldNumeric = getNumericValue(localValue);
      const newNumeric = getNumericValue(input);

      // Format the new value
      const formatted = formatPhoneNumber(input);

      // Calculate new cursor position
      let newCursorPos = cursorPos;

      // If we're deleting
      if (newNumeric.length < oldNumeric.length) {
        // Get positions of formatting characters
        const hasCountryCode = formatted.startsWith("1 ");
        const offset = hasCountryCode ? 2 : 0;

        // Adjust cursor position for formatting characters
        if (
          cursorPos === offset + 1 ||
          cursorPos === offset + 5 ||
          cursorPos === offset + 6 ||
          cursorPos === offset + 10
        ) {
          newCursorPos = cursorPos - 1;
        }
      } else if (newNumeric.length > oldNumeric.length) {
        // If we're adding
        const formattedBeforeCursor = formatPhoneNumber(input.slice(0, cursorPos));
        newCursorPos = formattedBeforeCursor.length;
      }

      setLocalValue(formatted);
      setCursorPosition(newCursorPos);

      // Call the onChange handler with the numeric value of what's displayed
      if (onChange) {
        onChange(getNumericValue(formatted));
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      const isNumber = /^\d$/.test(key);
      const isAllowedKey = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight"].includes(key);
      const isSelectAll = (e.ctrlKey || e.metaKey) && key === "a";
      const isCopy = (e.ctrlKey || e.metaKey) && key === "c";
      const isPaste = (e.ctrlKey || e.metaKey) && key === "v";
      const isCut = (e.ctrlKey || e.metaKey) && key === "x";

      if (isAllowedKey || isSelectAll || isCopy || isPaste || isCut || isNumber) {
        if (onKeyDown) {
          onKeyDown(e);
        }
        return;
      }

      // Prevent all other keys
      e.preventDefault();

      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    return (
      <Input
        type={type}
        // className={cn(className)}
        ref={inputRef}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
