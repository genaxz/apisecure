import { PasswordPolicyEnforcer } from "../../src/auth/passwordPolicy";

describe("Password Policy Enforcer", () => {
  let enforcer: PasswordPolicyEnforcer;

  beforeEach(() => {
    enforcer = new PasswordPolicyEnforcer();
  });

  test("accepts strong password", () => {
    const errors = enforcer.enforcePolicy("StrongP@ssw0rd");
    expect(errors).toHaveLength(0);
  });

  test("rejects short password", () => {
    const errors = enforcer.enforcePolicy("Weak1!");
    expect(errors).toContain("Password must be at least 8 characters long.");
  });

  test("requires uppercase letter", () => {
    const errors = enforcer.enforcePolicy("weakpassw0rd!");
    expect(errors).toContain(
      "Password must contain at least one uppercase letter."
    );
  });

  test("requires lowercase letter", () => {
    const errors = enforcer.enforcePolicy("STRONGP@SSW0RD");
    expect(errors).toContain(
      "Password must contain at least one lowercase letter."
    );
  });

  test("requires number", () => {
    const errors = enforcer.enforcePolicy("StrongP@ssword");
    expect(errors).toContain("Password must contain at least one number.");
  });

  test("requires special character", () => {
    const errors = enforcer.enforcePolicy("StrongPassw0rd");
    expect(errors).toContain(
      "Password must contain at least one special character."
    );
  });

  test("rejects password with too many consecutive repeats", () => {
    const errors = enforcer.enforcePolicy("StrongP@ssssw0rd");
    expect(errors).toContain(
      "Password must not contain more than 3 consecutive repeating characters."
    );
  });

  test("accepts custom configuration", () => {
    const customEnforcer = new PasswordPolicyEnforcer({
      minLength: 6,
      requireUppercase: false,
      requireSpecialChars: false,
      maxConsecutiveRepeats: 4,
    });
    const errors = customEnforcer.enforcePolicy("weakpassw0rddddd");
    expect(errors).toHaveLength(0);
  });
});
