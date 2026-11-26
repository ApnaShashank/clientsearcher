/**
 * Normalize phone numbers so duplicate detection works reliably across
 * formatted inputs like "+91 98765-43210", "09876543210", or "9876543210".
 */
export function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const norm = normalizePhone(raw);
  return norm.length >= 10 && norm.length <= 15;
}

export function getPhoneLast4(raw: string): string {
  const norm = normalizePhone(raw);
  return norm.slice(-4) || "0000";
}

export function formatWhatsAppLink(raw: string, message?: string): string {
  const norm = normalizePhone(raw);
  const full = norm.length === 10 ? `91${norm}` : norm;
  const base = `https://wa.me/${full}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}
