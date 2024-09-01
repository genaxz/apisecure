import { PasswordResetManager } from "../../src/auth/passwordReset";
import { PasswordPolicyEnforcer } from "../../src/auth/passwordPolicy";
import { updateConfig } from "../../src/utils/config";

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

describe("Password Reset Manager", () => {
  let resetManager: PasswordResetManager;

  beforeEach(() => {
    resetManager = new PasswordResetManager();
  });

  test("generates reset token", () => {
    const token = resetManager.generateResetToken("user123");
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  test("verifies valid reset token", () => {
    const token = resetManager.generateResetToken("user123");
    const userId = resetManager.verifyResetToken(token);
    expect(userId).toBe("user123");
  });

  test("rejects invalid reset token", () => {
    const userId = resetManager.verifyResetToken("invalid-token");
    expect(userId).toBeNull();
  });

  test("resets password with valid token and strong password", () => {
    const token = resetManager.generateResetToken("user123");
    const errors = resetManager.resetPassword(token, "StrongP@ssw0rd");
    expect(errors).toHaveLength(0);
  });

  test("rejects password reset with invalid token", () => {
    const errors = resetManager.resetPassword(
      "invalid-token",
      "StrongP@ssw0rd"
    );
    expect(errors).toContain("Invalid or expired reset token");
  });

  test("rejects password reset with weak password", () => {
    const token = resetManager.generateResetToken("user123");
    const errors = resetManager.resetPassword(token, "weak");
    expect(errors.length).toBeGreaterThan(0);
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
