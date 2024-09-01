import { AuthHelpers, User, JwtPayload } from "../../src/auth/authHelpers";
import { SecurityLibraryError } from "../../src/utils/customError";
import {
  globalRateLimiter,
  globalBruteForceProtection,
} from "../../src/protection/rateLimiter";
import { getConfig, SecurityConfig } from "../../src/utils/config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

jest.mock("../../src/utils/rateLimiter");
jest.mock("../../src/utils/logger");
jest.mock("../../src/utils/config");

type MockResponse = Partial<Response> & {
  locals: {
    [key: string]: any;
  };
};

describe("AuthHelpers", () => {
  let authHelpers: AuthHelpers;
  let mockConfig: SecurityConfig;

  beforeEach(() => {
    mockConfig = {
      jwtSecret: "test-secret",
      jwtExpiresIn: "1h",
      bcryptSaltRounds: 10,
      csrfTokenLength: 32,
      logLevel: 1, // LogLevel.WARN
      sessionTTL: 86400000, // 24 hours in milliseconds
      defaultRateLimit: {
        windowMs: 900000, // 15 minutes
        maxRequests: 100,
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxConsecutiveRepeats: 3,
      },
      passwordResetTTL: 3600000, // 1 hour in milliseconds
      twoFactorAuth: {
        issuer: "YourApp",
        tokenValidityWindow: 1,
      },
      encryptionSecret: "test-encryption-secret",
      environment: "development",
      cookieMaxAge: 86400000, // 24 hours in milliseconds
    };
    (getConfig as jest.Mock).mockReturnValue(mockConfig);
    authHelpers = new AuthHelpers();
  });

  describe("hashPassword", () => {
    it("should hash a valid password", async () => {
      const password = "ValidP@ssw0rd";
      const hash = await authHelpers.hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(password.length);
    });

    it("should throw an error for an invalid password", async () => {
      const invalidPassword = "weak";
      await expect(authHelpers.hashPassword(invalidPassword)).rejects.toThrow(
        SecurityLibraryError
      );
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const password = "ValidP@ssw0rd";
      const hash = await authHelpers.hashPassword(password);
      const isValid = await authHelpers.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should not verify an incorrect password", async () => {
      const password = "ValidP@ssw0rd";
      const hash = await authHelpers.hashPassword(password);
      const isValid = await authHelpers.verifyPassword("WrongP@ssw0rd", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const user: User = {
        id: "1",
        username: "testuser",
        password: "hash",
        role: "user",
      };
      const token = authHelpers.generateToken(user);
      const decoded = jwt.verify(token, mockConfig.jwtSecret) as JwtPayload;
      expect(decoded.userId).toBe(user.id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.role).toBe(user.role);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const user: User = {
        id: "1",
        username: "testuser",
        password: "hash",
        role: "user",
      };
      const token = authHelpers.generateToken(user);
      const payload = authHelpers.verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(user.id);
    });

    it("should return null for an invalid token", () => {
      const payload = authHelpers.verifyToken("invalid.token.here");
      expect(payload).toBeNull();
    });
  });

  describe("authenticate middleware", () => {
    let mockReq: Partial<Request>;
    let mockRes: MockResponse;
    let mockNext: NextFunction;
    let findUser: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: { username: "testuser", password: "ValidP@ssw0rd" },
        ip: "127.0.0.1",
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {},
      };
      mockNext = jest.fn();
      findUser = jest.fn();
      (globalRateLimiter.isAllowed as jest.Mock).mockReturnValue(true);
    });

    it("should authenticate a valid user", async () => {
      const user: User = {
        id: "1",
        username: "testuser",
        password: await authHelpers.hashPassword("ValidP@ssw0rd"),
        role: "user",
      };
      findUser.mockResolvedValue(user);

      await authHelpers.authenticate(findUser)(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.locals.user).toEqual(user);
      expect(mockRes.locals.token).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
      expect(globalBruteForceProtection.resetAttempts).toHaveBeenCalledWith(
        mockReq.ip
      );
    });

    it("should reject authentication when rate limit is exceeded", async () => {
      (globalRateLimiter.isAllowed as jest.Mock).mockReturnValue(false);

      await authHelpers.authenticate(findUser)(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject authentication with invalid credentials", async () => {
      findUser.mockResolvedValue(null);

      await authHelpers.authenticate(findUser)(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid credentials" })
      );
      expect(
        globalBruteForceProtection.recordFailedAttempt
      ).toHaveBeenCalledWith(mockReq.ip);
    });
  });

  describe("authorize middleware", () => {
    let mockReq: Partial<Request>;
    let mockRes: MockResponse;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        headers: { authorization: "Bearer validtoken" },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {},
      };
      mockNext = jest.fn();
    });

    it("should authorize a user with valid token and role", () => {
      const payload: JwtPayload = {
        userId: "1",
        username: "testuser",
        role: "admin",
      };
      jest.spyOn(authHelpers, "verifyToken").mockReturnValue(payload);

      authHelpers.authorize("admin")(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.locals.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject authorization with missing token", () => {
      mockReq.headers = {};

      authHelpers.authorize("admin")(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "No token provided" })
      );
    });

    it("should reject authorization with invalid token", () => {
      jest.spyOn(authHelpers, "verifyToken").mockReturnValue(null);

      authHelpers.authorize("admin")(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid token" })
      );
    });

    it("should reject authorization with insufficient permissions", () => {
      const payload: JwtPayload = {
        userId: "1",
        username: "testuser",
        role: "user",
      };
      jest.spyOn(authHelpers, "verifyToken").mockReturnValue(payload);

      authHelpers.authorize("admin")(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Insufficient permissions" })
      );
    });
  });
});
