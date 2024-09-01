import crypto from "crypto";
import base32 from "hi-base32";
import { getConfig } from "../utils/config";

export interface TwoFactorSecret {
  userId: string;
  secret: string;
  backupCodes: string[];
}

export class TwoFactorAuthManager {
  private secrets: Map<string, TwoFactorSecret> = new Map();
  private config = getConfig();

  generateSecret(userId: string): TwoFactorSecret {
    const secret = crypto.randomBytes(10).toString("hex");
    const backupCodes = this.generateBackupCodes();
    const twoFactorSecret: TwoFactorSecret = { userId, secret, backupCodes };
    this.secrets.set(userId, twoFactorSecret);
    return twoFactorSecret;
  }

  verifyToken(userId: string, token: string): boolean {
    const secret = this.secrets.get(userId)?.secret;
    if (!secret) return false;

    const validTokens = this.generateValidTokens(secret);
    return validTokens.includes(token);
  }

  useBackupCode(userId: string, code: string): boolean {
    const twoFactorSecret = this.secrets.get(userId);
    if (!twoFactorSecret) return false;

    const index = twoFactorSecret.backupCodes.indexOf(code);
    if (index === -1) return false;

    twoFactorSecret.backupCodes.splice(index, 1);
    return true;
  }

  getQRCodeUrl(userId: string, appName: string): string {
    const secret = this.secrets.get(userId)?.secret;
    if (!secret) throw new Error("Secret not found for user");

    const encodedSecret = base32
      .encode(Buffer.from(secret, "hex"))
      .replace(/=/g, "");
    return `otpauth://totp/${appName}:${userId}?secret=${encodedSecret}&issuer=${appName}`;
  }

  private generateBackupCodes(count: number = 8): string[] {
    return Array.from({ length: count }, () =>
      crypto.randomBytes(4).toString("hex")
    );
  }

  private generateValidTokens(secret: string): string[] {
    const timeStep = 30;
    const timeWindow = 1;
    const now = Math.floor(Date.now() / 1000);

    return Array.from({ length: timeWindow * 2 + 1 }, (_, i) => {
      const time = now - timeWindow * timeStep + i * timeStep;
      return this.generateTOTP(secret, time);
    });
  }

  private generateTOTP(secret: string, time: number): string {
    const timeHex = Buffer.alloc(8);
    timeHex.writeBigInt64BE(BigInt(Math.floor(time / 30)), 0);

    const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
    const hash = hmac.update(timeHex).digest();

    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    return (binary % 1000000).toString().padStart(6, "0");
  }
}
