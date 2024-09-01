import { TwoFactorAuthManager } from "../../src/auth/twoFactorAuth";
import { updateConfig } from "../../src/utils/config";

jest.mock("../../src/utils/config", () => ({
  getConfig: jest.fn(() => ({
    twoFactorAuth: {
      issuer: "TestApp",
      tokenValidityWindow: 1,
    },
  })),
  updateConfig: jest.fn(),
}));

describe("Two-Factor Authentication Manager", () => {
  let twoFactorAuthManager: TwoFactorAuthManager;

  beforeEach(() => {
    twoFactorAuthManager = new TwoFactorAuthManager();
  });

  test("generates secret", () => {
    const secret = twoFactorAuthManager.generateSecret("user123");
    expect(secret.userId).toBe("user123");
    expect(secret.secret).toBeTruthy();
    expect(secret.backupCodes).toHaveLength(8);
  });

  test("verifies valid token", () => {
    const secret = twoFactorAuthManager.generateSecret("user123");
    const token = twoFactorAuthManager["generateTOTP"](
      secret.secret,
      Math.floor(Date.now() / 1000)
    );
    expect(twoFactorAuthManager.verifyToken("user123", token)).toBe(true);
  });

  test("rejects invalid token", () => {
    twoFactorAuthManager.generateSecret("user123");
    expect(twoFactorAuthManager.verifyToken("user123", "000000")).toBe(false);
  });

  test("uses backup code", () => {
    const secret = twoFactorAuthManager.generateSecret("user123");
    const backupCode = secret.backupCodes[0];
    expect(twoFactorAuthManager.useBackupCode("user123", backupCode)).toBe(
      true
    );
    expect(twoFactorAuthManager.useBackupCode("user123", backupCode)).toBe(
      false
    );
  });

  test("generates QR code URL", () => {
    twoFactorAuthManager.generateSecret("user123");
    const url = twoFactorAuthManager.getQRCodeUrl("user123", "TestApp");
    expect(url).toMatch(
      /^otpauth:\/\/totp\/TestApp:user123\?secret=[A-Z2-7]+&issuer=TestApp$/
    );
  });
});
