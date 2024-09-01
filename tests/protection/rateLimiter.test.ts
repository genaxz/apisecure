import {
  RateLimiter,
  BruteForceProtection,
} from "../../src/protection/rateLimiter";
import { Request, Response } from "express";

describe("Rate Limiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter([{ windowMs: 1000, maxRequests: 2 }]);
  });

  test("allows requests within limit", () => {
    const req = { ip: "127.0.0.1" } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    rateLimiter.middleware()(req, res, next);
    rateLimiter.middleware()(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("blocks requests over limit", () => {
    const req = { ip: "127.0.0.1" } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    rateLimiter.middleware()(req, res, next);
    rateLimiter.middleware()(req, res, next);
    rateLimiter.middleware()(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: "Too many requests, please try again later.",
    });
  });

  test("isAllowed returns correct values", () => {
    const clientId = "127.0.0.1";

    expect(rateLimiter.isAllowed(clientId)).toBe(true);
    expect(rateLimiter.isAllowed(clientId)).toBe(true);
    expect(rateLimiter.isAllowed(clientId)).toBe(false);
  });
});

describe("Brute Force Protection", () => {
  let bruteForceProtection: BruteForceProtection;

  beforeEach(() => {
    bruteForceProtection = new BruteForceProtection(3, 1000);
  });

  test("allows attempts within limit", () => {
    const identifier = "127.0.0.1";

    expect(bruteForceProtection.isAllowed(identifier)).toBe(true);
    bruteForceProtection.recordFailedAttempt(identifier);
    bruteForceProtection.recordFailedAttempt(identifier);
    expect(bruteForceProtection.isAllowed(identifier)).toBe(true);
  });

  test("blocks attempts over limit", () => {
    const identifier = "127.0.0.1";

    bruteForceProtection.recordFailedAttempt(identifier);
    bruteForceProtection.recordFailedAttempt(identifier);
    bruteForceProtection.recordFailedAttempt(identifier);
    expect(bruteForceProtection.isAllowed(identifier)).toBe(false);
  });

  test("resets attempts", () => {
    const identifier = "127.0.0.1";

    bruteForceProtection.recordFailedAttempt(identifier);
    bruteForceProtection.recordFailedAttempt(identifier);
    bruteForceProtection.resetAttempts(identifier);
    expect(bruteForceProtection.isAllowed(identifier)).toBe(true);
  });

  test("middleware blocks requests when limit exceeded", () => {
    const req = { ip: "127.0.0.1" } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    bruteForceProtection.recordFailedAttempt(req.ip || "unknown");
    bruteForceProtection.recordFailedAttempt(req.ip || "unknown");
    bruteForceProtection.recordFailedAttempt(req.ip || "unknown");

    bruteForceProtection.middleware()(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error:
        "Account temporarily locked due to too many failed attempts. Please try again later.",
    });
  });
});
