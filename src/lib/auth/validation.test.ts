import { describe, it, expect } from "vitest";
import { validateEmailFormat } from "./email-format";
import { verifyDomainMailExchange, validateEmail } from "./validation";

describe("validateEmailFormat", () => {
  it("rejects empty or whitespace inputs", () => {
    expect(validateEmailFormat("").valid).toBe(false);
    expect(validateEmailFormat("   ").valid).toBe(false);
  });

  it("rejects emails without '@' or with multiple '@'", () => {
    expect(validateEmailFormat("plainaddress").valid).toBe(false);
    expect(validateEmailFormat("user@@example.com").valid).toBe(false);
    expect(validateEmailFormat("user@domain@extra.com").valid).toBe(false);
  });

  it("rejects emails with invalid local parts", () => {
    expect(validateEmailFormat("@example.com").valid).toBe(false);
    expect(validateEmailFormat(".user@example.com").valid).toBe(false);
    expect(validateEmailFormat("user.@example.com").valid).toBe(false);
    expect(validateEmailFormat("user..name@example.com").valid).toBe(false);
    expect(validateEmailFormat("user name@example.com").valid).toBe(false);
    expect(validateEmailFormat(`${"a".repeat(65)}@example.com`).valid).toBe(false);
  });

  it("rejects emails with malformed domain parts or invalid TLD", () => {
    expect(validateEmailFormat("user@com").valid).toBe(false);
    expect(validateEmailFormat("user@.com").valid).toBe(false);
    expect(validateEmailFormat("user@domain..com").valid).toBe(false);
    expect(validateEmailFormat("user@-domain.com").valid).toBe(false);
    expect(validateEmailFormat("user@domain-.com").valid).toBe(false);
    expect(validateEmailFormat("user@domain.c").valid).toBe(false);
    expect(validateEmailFormat("user@domain.123").valid).toBe(false);
  });

  it("rejects RFC reserved domains", () => {
    expect(validateEmailFormat("user@example.com").valid).toBe(false);
    expect(validateEmailFormat("user@test.com").valid).toBe(false);
    expect(validateEmailFormat("user@localhost").valid).toBe(false);
  });

  it("rejects disposable throwaway domains", () => {
    expect(validateEmailFormat("user@mailinator.com").valid).toBe(false);
    expect(validateEmailFormat("user@tempmail.com").valid).toBe(false);
    expect(validateEmailFormat("user@10minutemail.com").valid).toBe(false);
    expect(validateEmailFormat("user@guerrillamail.com").valid).toBe(false);
    expect(validateEmailFormat("user@yopmail.com").valid).toBe(false);
  });

  it("accepts structurally valid emails", () => {
    const res1 = validateEmailFormat("user.name+tag@gmail.com");
    expect(res1.valid).toBe(true);
    expect(res1.normalizedEmail).toBe("user.name+tag@gmail.com");
    expect(res1.domain).toBe("gmail.com");

    const res2 = validateEmailFormat("student_99@sub.university.edu");
    expect(res2.valid).toBe(true);
    expect(res2.normalizedEmail).toBe("student_99@sub.university.edu");
    expect(res2.domain).toBe("sub.university.edu");
  });
});

describe("verifyDomainMailExchange and validateEmail", () => {
  it("verifies domains that have active MX records", async () => {
    const result = await verifyDomainMailExchange("gmail.com");
    expect(result.valid).toBe(true);
  });

  it("fails for non-existent domains", async () => {
    const result = await verifyDomainMailExchange("nonexistentdomainxyz999fake.com");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("does not exist");
  });

  it("validateEmail accepts legitimate emails with active domains", async () => {
    const result = await validateEmail("test.student@gmail.com");
    expect(result.valid).toBe(true);
    expect(result.normalizedEmail).toBe("test.student@gmail.com");
  });

  it("validateEmail rejects fake domain emails", async () => {
    const result = await validateEmail("user@nonexistentdomainxyz999fake.com");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("validateEmail rejects disposable email domains", async () => {
    const result = await validateEmail("user@mailinator.com");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Disposable");
  });
});
