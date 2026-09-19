import dns from "node:dns/promises";
import {
  validateEmailFormat,
  EmailValidationResult,
} from "./email-format";

export * from "./email-format";

/**
 * Checks DNS records (MX records, falling back to A records per RFC 5321) to ensure
 * the email domain is active and configured to accept mail.
 */
export async function verifyDomainMailExchange(
  domain: string,
  timeoutMs = 4000,
): Promise<{ valid: boolean; error?: string }> {
  const checkDns = async (): Promise<{ valid: boolean; error?: string }> => {
    try {
      // 1. Check MX records
      const mxRecords = await dns.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        return { valid: true };
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;

      if (code === "ENOTFOUND" || code === "NXDOMAIN") {
        return {
          valid: false,
          error: `The email domain '@${domain}' does not exist. Please check your spelling.`,
        };
      }

      // If no MX records found (ENODATA), fall back to checking A / AAAA records per RFC 5321 §5.1
      if (code === "ENODATA") {
        try {
          const aRecords = await dns.resolve4(domain);
          if (aRecords && aRecords.length > 0) {
            return { valid: true };
          }
        } catch {
          return {
            valid: false,
            error: `The domain '@${domain}' is not configured to receive emails.`,
          };
        }
      }

      // For network timeouts or transient DNS issues, log warning
      console.warn(`DNS lookup warning for domain ${domain}:`, code || err);
      if (code === "ETIMEOUT" || code === "SERVFAIL" || code === "ECONNREFUSED") {
        return {
          valid: false,
          error: `Unable to verify domain '@${domain}' at this time. Please try again.`,
        };
      }

      return {
        valid: false,
        error: `Could not verify domain '@${domain}'.`,
      };
    }

    return {
      valid: false,
      error: `The domain '@${domain}' has no valid mail servers configured.`,
    };
  };

  const timeoutPromise = new Promise<{ valid: boolean; error?: string }>((resolve) =>
    setTimeout(
      () =>
        resolve({
          valid: false,
          error: `Verification for domain '@${domain}' timed out. Please try again.`,
        }),
      timeoutMs,
    ),
  );

  return Promise.race([checkDns(), timeoutPromise]);
}

/**
 * Complete email validation: validates syntax, domain structure, and DNS mail exchange capability.
 */
export async function validateEmail(rawEmail: string): Promise<EmailValidationResult> {
  const formatResult = validateEmailFormat(rawEmail);
  if (!formatResult.valid || !formatResult.domain || !formatResult.normalizedEmail) {
    return formatResult;
  }

  const dnsResult = await verifyDomainMailExchange(formatResult.domain);
  if (!dnsResult.valid) {
    return {
      valid: false,
      error: dnsResult.error,
      normalizedEmail: formatResult.normalizedEmail,
      domain: formatResult.domain,
    };
  }

  return {
    valid: true,
    normalizedEmail: formatResult.normalizedEmail,
    domain: formatResult.domain,
  };
}
