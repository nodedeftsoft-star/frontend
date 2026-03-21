const formatPhoneNumber = (value: string) => {
  if (!value) return "";

  const trimmed = value.trim();

  // Legacy format check (e.g. "(347) 365-0367")
  const legacyUSPattern = /^\(\d{3}\)\s*\d{3}-\d{4}$/;
  if (legacyUSPattern.test(trimmed)) {
    return trimmed; // Already in readable US format — preserve as-is
  }

  // Extract digits only
  const digits = value.replace(/\D/g, "");

  // Handle US numbers (10 or 11 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Handle international numbers starting with +
  if (trimmed.startsWith("+")) {
    const internationalDigits = trimmed.slice(1).replace(/\D/g, "");
    if (internationalDigits.length >= 10) {
      // Format as international: +XX XXX XXX XXXX
      return `+${internationalDigits.slice(0, 2)} ${internationalDigits.slice(2, 5)} ${internationalDigits.slice(
        5,
        8
      )} ${internationalDigits.slice(8)}`;
    }
  }

  return value; // fallback for unrecognized formats
};

export default formatPhoneNumber;

export const normalizeToE164 = (value: string, defaultCountry: string = "US"): string | undefined => {
  if (!value) return undefined;

  const trimmed = value.trim();

  // If it's already in E.164 format (+XXXXXXXXXXX), validate and return
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) {
      return `+${digits}`;
    }
  }

  // Extract digits only
  const digits = value.replace(/\D/g, "");

  // Handle US numbers
  if (defaultCountry === "US") {
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }
  }

  // For other countries, assume valid if 10-15 digits
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return undefined;
};

export const formatPhoneToInternational = (value: string): string => {
  if (!value) return "";

  // Extract digits only
  const digits = value.replace(/\D/g, "");

  // Handle US numbers (10 or 11 digits)
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  // Return original value if it doesn't match expected format
  return value;
};

export const formatPhoneNumberInput = (value: string) => {
  // Remove all non-digit characters but keep leading +
  const hasPlus = value.startsWith("+");
  const digits = hasPlus ? value.substring(1).replace(/\D/g, "") : value.replace(/\D/g, "");

  // For numbers with a country code (starts with +)
  if (hasPlus) {
    // First digit after + is the country code (simplification - actual country codes vary in length)
    // Extract country code (assume first digit if present)
    const countryCode = digits.length > 0 ? digits.charAt(0) : "1"; // Default to 1 if empty
    const remaining = digits.substring(countryCode.length);

    // Format the remaining digits in (XXX) XXX-XXXX format if they match US pattern
    if (remaining.length >= 10) {
      return `+${countryCode} (${remaining.slice(0, 3)}) ${remaining.slice(3, 6)}-${remaining.slice(6, 10)}`;
    } else if (remaining.length > 6) {
      return `+${countryCode} (${remaining.slice(0, 3)}) ${remaining.slice(3, 6)}-${remaining.slice(6)}`;
    } else if (remaining.length > 3) {
      return `+${countryCode} (${remaining.slice(0, 3)}) ${remaining.slice(3)}`;
    } else if (remaining.length > 0) {
      return `+${countryCode} (${remaining})`;
    }
    return `+${countryCode}`;
  }

  // For numbers without + (auto-add +1)
  else {
    if (digits.length >= 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length > 6) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `+1 (${digits})`;
    }
    return "";
  }
};
