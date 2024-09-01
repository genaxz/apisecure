import crypto from "crypto";
import axios from "axios";
import zxcvbn from "zxcvbn";
import { getConfig } from "../utils/config";

async function isPasswordCommon(password: string): Promise<boolean> {
  const sha1 = crypto
    .createHash("sha1")
    .update(password)
    .digest("hex")
    .toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await axios.get(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );
    const hashes = response.data.split("\n");
    return hashes.some((hash: string) => hash.startsWith(suffix));
  } catch (error) {
    console.error("Error checking password commonality:", error);
    return false; // Fail open - assume password is not common if check fails
  }
}

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxConsecutiveRepeats: number;
}

export class PasswordPolicyEnforcer {
  private config: PasswordPolicyConfig;

  constructor(config?: Partial<PasswordPolicyConfig>) {
    const defaultConfig = getConfig().passwordPolicy;
    this.config = { ...defaultConfig, ...config };
  }

  async enforcePolicy(password: string): Promise<string[]> {
    const errors: string[] = [];

    if (password.length < this.config.minLength) {
      errors.push(
        `Password must be at least ${this.config.minLength} characters long.`
      );
    }

    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter.");
    }

    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter.");
    }

    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number.");
    }

    if (
      this.config.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push("Password must contain at least one special character.");
    }

    if (
      this.hasConsecutiveRepeats(password, this.config.maxConsecutiveRepeats)
    ) {
      errors.push(
        `Password must not contain more than ${this.config.maxConsecutiveRepeats} consecutive repeating characters.`
      );
    }
    if (await isPasswordCommon(password)) {
      errors.push(
        "This password has been exposed in data breaches. Please choose a different password."
      );
    }
    const strength = zxcvbn(password);
    if (strength.score < 3) {
      errors.push("Password is too weak. Please choose a stronger password.");
    }

    return errors;
  }

  private hasConsecutiveRepeats(password: string, maxRepeats: number): boolean {
    for (let i = 0; i < password.length - maxRepeats; i++) {
      const chunk = password.slice(i, i + maxRepeats + 1);
      if (new Set(chunk).size === 1) {
        return true;
      }
    }
    return false;
  }
}
