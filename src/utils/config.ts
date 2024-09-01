import fs from "fs";
import path from "path";
import { LogLevel } from "./securityLogger";
import { PasswordPolicyConfig } from "../auth/passwordPolicy";

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  csrfTokenLength: number;
  logLevel: LogLevel;
  sessionTTL: number;
  defaultRateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  passwordPolicy: PasswordPolicyConfig;
  passwordResetTTL: number;
  twoFactorAuth: {
    issuer: string;
    tokenValidityWindow: number;
  };
  encryptionSecret: string;
  environment: "development" | "production";
  cookieMaxAge: number;
}

const defaultConfig: SecurityConfig = {
  jwtSecret: process.env.JWT_SECRET || "",
  encryptionSecret: process.env.ENCRYPTION_SECRET || "",
  jwtExpiresIn: "1h",
  bcryptSaltRounds: 10,
  csrfTokenLength: 32,
  logLevel: 2, //LogLevel.WARN
  sessionTTL: 24 * 60 * 60 * 1000, // 24 hours
  defaultRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxConsecutiveRepeats: 3,
    minStrengthScore: 3,
  },
  passwordResetTTL: 60 * 60 * 1000, // 1 hour
  twoFactorAuth: {
    issuer: "YourApp",
    tokenValidityWindow: 1, // Number of time steps to check before and after the current time
  },
  environment:
    (process.env.NODE_ENV as "development" | "production") || "development",
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SecurityConfig;

  private constructor() {
    this.config = { ...defaultConfig };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): SecurityConfig {
    return this.config;
  }

  public loadFromEnv(): void {
    this.updateConfig({
      jwtSecret: process.env.JWT_SECRET || this.config.jwtSecret,
      encryptionSecret:
        process.env.ENCRYPTION_SECRET || this.config.encryptionSecret,
      // Add other environment variables as needed
    });
  }

  public loadFromFile(filePath: string): void {
    try {
      const fileContent = fs.readFileSync(path.resolve(filePath), "utf8");
      const fileConfig = JSON.parse(fileContent);
      this.updateConfig(fileConfig);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to load configuration file: ${error.message}`);
      } else {
        throw new Error(
          "Failed to load configuration file due to an unknown error"
        );
      }
    }
  }

  private validateConfig(config: SecurityConfig): void {
    if (process.env.NODE_ENV !== "test") {
      if (!config.jwtSecret || config.jwtSecret === "your-secret-key") {
        throw new Error("JWT secret must be set to a secure value");
      }
      if (
        !config.encryptionSecret ||
        config.encryptionSecret === "your-encryption-secret-key"
      ) {
        throw new Error("Encryption secret must be set to a secure value");
      }
    }
    // Add more validations as needed
    if (config.bcryptSaltRounds < 10) {
      throw new Error("bcryptSaltRounds should be at least 10");
    }
    if (config.passwordPolicy.minLength < 8) {
      throw new Error(
        "Minimum password length should be at least 8 characters"
      );
    }
    // ... (add more validations for other security-related configurations)
  }

  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    try {
      const updatedConfig = { ...this.config, ...newConfig };
      this.validateConfig(updatedConfig);
      this.config = updatedConfig;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Configuration update failed: ${error.message}`);
      } else {
        throw new Error("Configuration update failed due to an unknown error");
      }
    }
  }
}

export const getConfig = (): SecurityConfig =>
  ConfigManager.getInstance().getConfig();
export const updateConfig = (newConfig: Partial<SecurityConfig>): void =>
  ConfigManager.getInstance().updateConfig(newConfig);
