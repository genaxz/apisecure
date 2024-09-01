import { Request, Response, NextFunction } from "express";
import { getConfig } from "../../src/utils/config";
import { SecurityLibraryError } from "../../src/utils/customError";
import { globalLogger } from "../utils/logger";

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private storage: Map<string, RateLimitInfo> = new Map();
  private rules: RateLimitRule[];

  constructor(rules: RateLimitRule[] = []) {
    this.rules = rules.length > 0 ? rules : [getConfig().defaultRateLimit];
  }

  private getClientIdentifier(req: Request): string {
    return req.ip || req.connection.remoteAddress || "unknown";
  }
  private cleanup(): void {
    const now = Date.now();
    for (const [key, limitInfo] of this.storage) {
      if (now > limitInfo.resetTime) {
        this.storage.delete(key);
      }
    }
  }
  isAllowed(clientId: string): boolean {
    this.cleanup();
    const now = Date.now();
    let isAllowed = true;

    this.rules.forEach((rule) => {
      const key = `${clientId}:${rule.windowMs}`;
      const limitInfo = this.storage.get(key) || {
        count: 0,
        resetTime: now + rule.windowMs,
      };

      if (now > limitInfo.resetTime) {
        limitInfo.count = 1;
        limitInfo.resetTime = now + rule.windowMs;
      } else {
        limitInfo.count++;
      }

      this.storage.set(key, limitInfo);

      if (limitInfo.count > rule.maxRequests) {
        isAllowed = false;
      }
    });

    return isAllowed;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = this.getClientIdentifier(req);

      if (this.isAllowed(clientId)) {
        next();
      } else {
        const error = new SecurityLibraryError("Rate limit exceeded", 429);
        globalLogger.warn("Rate limit exceeded", { clientId, path: req.path });
        res.status(429).json({ error: error.message });
      }
    };
  }

  reset(clientId: string): void {
    this.rules.forEach((rule) => {
      const key = `${clientId}:${rule.windowMs}`;
      this.storage.delete(key);
    });
  }
}

export class BruteForceProtection {
  private failedAttempts: Map<string, number> = new Map();
  private lastAttemptTime: Map<string, number> = new Map(); // Add this line
  private lockoutDuration: number;
  private maxAttempts: number;

  constructor(
    maxAttempts: number = 5,
    lockoutDuration: number = 15 * 60 * 1000
  ) {
    this.maxAttempts = maxAttempts;
    this.lockoutDuration = lockoutDuration;
  }

  recordFailedAttempt(identifier: string) {
    const attempts = (this.failedAttempts.get(identifier) || 0) + 1;
    this.failedAttempts.set(identifier, attempts);
    this.lastAttemptTime.set(identifier, Date.now()); // Add this line

    if (attempts >= this.maxAttempts) {
      globalLogger.warn("Account locked due to too many failed attempts", {
        identifier,
      });
    }
  }

  resetAttempts(identifier: string) {
    this.failedAttempts.delete(identifier);
    this.lastAttemptTime.delete(identifier); // Add this line
  }

  isAllowed(identifier: string): boolean {
    this.clearExpiredLockouts();
    return (this.failedAttempts.get(identifier) || 0) < this.maxAttempts;
  }

  private clearExpiredLockouts(): void {
    const now = Date.now();
    for (const [identifier, attempts] of this.failedAttempts) {
      const lastAttemptTime = this.lastAttemptTime.get(identifier);
      if (
        lastAttemptTime &&
        attempts >= this.maxAttempts &&
        now - lastAttemptTime > this.lockoutDuration
      ) {
        this.failedAttempts.delete(identifier);
        this.lastAttemptTime.delete(identifier);
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const identifier = this.getClientIdentifier(req);

      if (this.isAllowed(identifier)) {
        next();
      } else {
        const error = new SecurityLibraryError(
          "Account temporarily locked",
          403
        );
        globalLogger.warn("Blocked attempt on locked account", {
          identifier,
          path: req.path,
        });
        res.status(403).json({ error: error.message });
      }
    };
  }

  private getClientIdentifier(req: Request): string {
    return req.ip || req.connection.remoteAddress || "unknown";
  }
}

export const globalRateLimiter = new RateLimiter();
export const globalBruteForceProtection = new BruteForceProtection();
