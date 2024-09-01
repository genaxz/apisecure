import crypto from "crypto";
import { getConfig } from "../utils/config";
import { PasswordPolicyEnforcer } from "./passwordPolicy";

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

export class PasswordResetManager {
  private tokens: Map<string, PasswordResetToken> = new Map();
  private config = getConfig();
  private policyEnforcer: PasswordPolicyEnforcer;

  constructor(policyEnforcer?: PasswordPolicyEnforcer) {
    this.policyEnforcer = policyEnforcer || new PasswordPolicyEnforcer();
  }

  generateResetToken(userId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + this.config.passwordResetTTL);

    this.tokens.set(token, { token, userId, expiresAt });

    return token;
  }

  verifyResetToken(token: string): string | null {
    const resetToken = this.tokens.get(token);

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken.userId;
  }

  resetPassword(token: string, newPassword: string): string[] {
    const userId = this.verifyResetToken(token);

    if (!userId) {
      return ["Invalid or expired reset token"];
    }

    const policyErrors = this.policyEnforcer.enforcePolicy(newPassword);

    if (policyErrors.length > 0) {
      return policyErrors;
    }

    // Here you would typically update the user's password in your database
    // For this example, we'll just remove the used token
    this.tokens.delete(token);

    return [];
  }

  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, resetToken] of this.tokens.entries()) {
      if (resetToken.expiresAt < now) {
        this.tokens.delete(token);
      }
    }
  }
}
