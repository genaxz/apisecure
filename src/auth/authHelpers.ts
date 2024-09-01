import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getConfig } from "../utils/config";
import { SecurityLibraryError } from "../utils/customError";
import {
  globalBruteForceProtection,
  globalRateLimiter,
} from "../../src/protection/rateLimiter";
import { globalLogger } from "../utils/logger";

export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

export class AuthHelpers {
  private config = getConfig();

  async hashPassword(password: string): Promise<string> {
    this.validatePassword(password);
    return bcrypt.hash(password, this.config.bcryptSaltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    const jti = crypto.randomBytes(32).toString("hex"); // Add a unique token identifier
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      jwtid: jti,
    });
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.config.jwtSecret) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  authenticate(findUser: (username: string) => Promise<User | null>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const clientId = req.ip || req.connection.remoteAddress || "unknown";

      if (!globalRateLimiter.isAllowed(clientId)) {
        const error = new SecurityLibraryError(
          "Too many authentication attempts",
          429
        );
        globalLogger.warn("Rate limit exceeded for authentication", {
          clientId,
        });
        return res.status(429).json({ error: error.message });
      }

      try {
        const { username, password } = req.body;
        if (!username || !password) {
          throw new SecurityLibraryError(
            "Username and password are required",
            400
          );
        }
        const user = await findUser(username);
        if (!user || !(await this.verifyPassword(password, user.password))) {
          globalBruteForceProtection.recordFailedAttempt(clientId);
          throw new SecurityLibraryError("Invalid credentials", 401);
        }
        const token = this.generateToken(user);
        res.locals.user = user;
        res.locals.token = token;
        globalBruteForceProtection.resetAttempts(clientId);
        globalLogger.info("User authenticated successfully", { username });
        next();
      } catch (error) {
        if (error instanceof SecurityLibraryError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          globalLogger.error("Unexpected error during authentication", {
            error,
          });
          res.status(500).json({ error: "Internal server error" });
        }
      }
    };
  }

  authorize(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
          throw new SecurityLibraryError("No token provided", 401);
        }
        const payload = this.verifyToken(token);
        if (!payload) {
          throw new SecurityLibraryError("Invalid token", 401);
        }
        if (!allowedRoles.includes(payload.role)) {
          throw new SecurityLibraryError("Insufficient permissions", 403);
        }
        res.locals.user = payload;
        globalLogger.info("User authorized successfully", {
          userId: payload.userId,
          role: payload.role,
        });
        next();
      } catch (error) {
        if (error instanceof SecurityLibraryError) {
          globalLogger.warn("Authorization failed", { error: error.message });
          res.status(error.statusCode).json({ error: error.message });
        } else {
          globalLogger.error("Unexpected error during authorization", {
            error,
          });
          res.status(500).json({ error: "Internal server error" });
        }
      }
    };
  }

  private validatePassword(password: string): void {
    if (password.length < this.config.passwordPolicy.minLength) {
      throw new SecurityLibraryError(
        `Password must be at least ${this.config.passwordPolicy.minLength} characters long`,
        400
      );
    }
    if (
      this.config.passwordPolicy.requireUppercase &&
      !/[A-Z]/.test(password)
    ) {
      throw new SecurityLibraryError(
        "Password must contain at least one uppercase letter",
        400
      );
    }
    if (
      this.config.passwordPolicy.requireLowercase &&
      !/[a-z]/.test(password)
    ) {
      throw new SecurityLibraryError(
        "Password must contain at least one lowercase letter",
        400
      );
    }
    if (this.config.passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
      throw new SecurityLibraryError(
        "Password must contain at least one number",
        400
      );
    }
    if (
      this.config.passwordPolicy.requireSpecialChars &&
      !/[!@#$%^&*]/.test(password)
    ) {
      throw new SecurityLibraryError(
        "Password must contain at least one special character (!@#$%^&*)",
        400
      );
    }
  }
}
