import { PasswordResetManager } from "../../src/auth/passwordReset";
import { PasswordPolicyEnforcer } from "../../src/auth/passwordPolicy";

jest.mock("../../src/utils/config", () => ({
  getConfig: jest.fn(() => ({
    passwordResetTTL: 3600000, // 1 hour
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxConsecutiveRepeats: 3,
    },
  })),
  updateConfig: jest.fn(),
}));

jest.mock("../../src/auth/passwordPolicy", () => {
  return {
    PasswordPolicyEnforcer: jest.fn().mockImplementation(() => ({
      enforcePolicy: jest.fn().mockResolvedValue([]),
    })),
  };
});

describe("Password Reset Manager", () => {
  let resetManager: PasswordResetManager;
  let mockEnforcePolicy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnforcePolicy = jest.fn().mockResolvedValue([]);
    (PasswordPolicyEnforcer as jest.Mock).mockImplementation(() => ({
      enforcePolicy: mockEnforcePolicy,
    }));
    resetManager = new PasswordResetManager();
  });
  test("resets password with valid token and strong password", async () => {
    const token = resetManager.generateResetToken("user123");
    const errors = await resetManager.resetPassword(token, "StrongP@ssw0rd");
    expect(Array.isArray(errors)).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test("rejects password reset with invalid token", async () => {
    const errors = await resetManager.resetPassword(
      "invalid-token",
      "StrongP@ssw0rd"
    );
    expect(Array.isArray(errors)).toBe(true);
    expect(errors).toContain("Invalid or expired reset token");
  });

  test("rejects password reset with weak password", async () => {
    mockEnforcePolicy.mockResolvedValue(["Password is too weak"]);
    const token = resetManager.generateResetToken("user123");
    const errors = await resetManager.resetPassword(token, "weak");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain("Password is too weak");
  });

  test("cleans up expired tokens", () => {
    jest.useFakeTimers();
    const token = resetManager.generateResetToken("user123");

    jest.advanceTimersByTime(3600001); // Advance time just past expiration

    resetManager.cleanupExpiredTokens();
    const userId = resetManager.verifyResetToken(token);
    expect(userId).toBeNull();

    jest.useRealTimers();
  });
});
