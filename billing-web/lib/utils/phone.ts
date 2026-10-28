// Indian mobile numbers: 10 digits, first digit 6-9. Accepts an optional +91/91 prefix and
// strips spaces/dashes before checking, since a cashier might paste a number formatted either way.
const PHONE_REGEX = /^[6-9]\d{9}$/;
// The country code is only stripped when what remains is a full 10-digit mobile number. The old
// unconditional /^(\+?91)/ strip turned every valid number that merely STARTS with 91 (e.g.
// 9123456789 — a common Indian prefix) into "23456789", so those customers could not be billed.
const WITH_COUNTRY_CODE = /^(?:\+91|91)([6-9]\d{9})$/;

export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s-]/g, "");
  const withCode = compact.match(WITH_COUNTRY_CODE);
  return withCode ? withCode[1] : compact;
}

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(normalizePhone(value));
}
