// Indian mobile numbers: 10 digits, first digit 6-9. Accepts an optional +91/91 prefix and
// strips spaces/dashes before checking, since a cashier might paste a number formatted either way.
const PHONE_REGEX = /^[6-9]\d{9}$/;

export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s-]/g, "").replace(/^(\+?91)/, "");
}

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(normalizePhone(value));
}
