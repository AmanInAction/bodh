// RFC 2606 / 6761 reserved domains that should not receive production email
export const RESERVED_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "example.edu",
  "test.com",
  "localhost",
  "invalid",
]);

// Common temporary / disposable email providers
export const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "sharklasers.com",
  "trashmail.com",
  "dispostable.com",
  "getairmail.com",
  "throwawaymail.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "tempail.com",
  "burnermail.io",
]);

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  normalizedEmail?: string;
  domain?: string;
}

/**
 * Validates the syntactic structure of an email address according to RFC standards.
 * Safe to run both in the browser and on the server.
 */
export function validateEmailFormat(rawEmail: string): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== "string") {
    return { valid: false, error: "Please enter an email address." };
  }

  const email = rawEmail.trim().toLowerCase();

  if (email.length === 0) {
    return { valid: false, error: "Please enter an email address." };
  }

  if (email.length > 254) {
    return { valid: false, error: "Email address is too long (maximum 254 characters)." };
  }

  const atParts = email.split("@");
  if (atParts.length !== 2) {
    return { valid: false, error: "Enter a valid email address with a single '@'." };
  }

  const [localPart, domain] = atParts;

  // Validate local-part
  if (!localPart || localPart.length > 64) {
    return { valid: false, error: "Enter a valid email username (1 to 64 characters)." };
  }

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return { valid: false, error: "Email address cannot start or end with a period." };
  }

  if (localPart.includes("..")) {
    return { valid: false, error: "Email address cannot contain consecutive periods." };
  }

  // Allowed characters in local part (RFC 5322 compatible without quotes)
  const localPartRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localPartRegex.test(localPart)) {
    return { valid: false, error: "Email contains invalid characters before '@'." };
  }

  // Validate domain part
  if (!domain || domain.length > 253) {
    return { valid: false, error: "Email domain is invalid." };
  }

  if (domain.startsWith(".") || domain.endsWith(".")) {
    return { valid: false, error: "Email domain cannot start or end with a period." };
  }

  const labels = domain.split(".");
  if (labels.length < 2) {
    return { valid: false, error: "Email domain must include a valid extension (e.g., .com, .edu)." };
  }

  const labelRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  for (const label of labels) {
    if (!label || label.length > 63 || !labelRegex.test(label)) {
      return { valid: false, error: `Email domain label '${label}' is malformed.` };
    }
  }

  // Top-Level Domain (TLD) must be purely alphabetic and at least 2 characters
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return { valid: false, error: "Email must have a valid top-level domain (e.g. .com, .org, .in)." };
  }

  if (RESERVED_DOMAINS.has(domain)) {
    return { valid: false, error: "Reserved domain names cannot be used for registration." };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: "Disposable temporary email addresses are not permitted." };
  }

  return {
    valid: true,
    normalizedEmail: email,
    domain,
  };
}
