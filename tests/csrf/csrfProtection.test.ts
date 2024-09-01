import { CsrfProtector } from "../../src/csrf/csrfProtection";
import { Request, Response, NextFunction } from "express";

describe("CSRF Protection", () => {
  let csrfProtector: CsrfProtector;

  beforeEach(() => {
    csrfProtector = new CsrfProtector();
  });

  test("generateToken creates a token of correct length", () => {
    const token = csrfProtector.generateToken();
    expect(token).toHaveLength(64); // 32 bytes in hex = 64 characters
  });

  test("generateToken creates unique tokens", () => {
    const token1 = csrfProtector.generateToken();
    const token2 = csrfProtector.generateToken();
    expect(token1).not.toBe(token2);
  });

  test("middleware sets CSRF token for GET requests with res.cookie", () => {
    const req = { method: "GET" } as Request;
    const res = {
      cookie: jest.fn(),
      locals: {},
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    csrfProtector.middleware()(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "XSRF-TOKEN",
      expect.any(String),
      expect.any(Object)
    );
    expect(res.locals.csrfToken).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test("middleware sets CSRF token for GET requests without res.cookie", () => {
    const req = { method: "GET" } as Request;
    const res = {
      setHeader: jest.fn(),
      locals: {},
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    csrfProtector.middleware()(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.stringContaining("XSRF-TOKEN=")
    );
    expect(res.locals.csrfToken).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test("middleware validates CSRF token for non-GET requests with cookie-parser", () => {
    const token = "valid-token";
    const req = {
      method: "POST",
      cookies: { "XSRF-TOKEN": token },
      header: jest.fn().mockReturnValue(token),
    } as unknown as Request;
    const res = {
      cookie: jest.fn(),
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    csrfProtector.middleware()(req, res, next);

    expect(req.header).toHaveBeenCalledWith("X-XSRF-TOKEN");
    expect(res.cookie).toHaveBeenCalledWith(
      "XSRF-TOKEN",
      expect.any(String),
      expect.any(Object)
    );
    expect(res.locals.csrfToken).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test("middleware validates CSRF token for non-GET requests without cookie-parser", () => {
    const token = "valid-token";
    const req = {
      method: "POST",
      headers: { cookie: `XSRF-TOKEN=${token}` },
      header: jest.fn().mockReturnValue(token),
    } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    csrfProtector.middleware()(req, res, next);

    expect(req.header).toHaveBeenCalledWith("X-XSRF-TOKEN");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.stringContaining("XSRF-TOKEN=")
    );
    expect(res.locals.csrfToken).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test("middleware rejects request with invalid CSRF token", () => {
    const req = {
      method: "POST",
      headers: { cookie: "XSRF-TOKEN=cookie-token" },
      header: jest.fn().mockReturnValue("header-token"),
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    csrfProtector.middleware()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "CSRF token validation failed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("attachCsrfToken generates and attaches token if not present", () => {
    const req = {} as Request;
    const res = {
      cookie: jest.fn(),
      locals: {},
    } as unknown as Response;

    const token = csrfProtector.attachCsrfToken(req, res);

    expect(token).toBeDefined();
    expect(res.cookie).toHaveBeenCalledWith(
      "XSRF-TOKEN",
      token,
      expect.any(Object)
    );
    expect(res.locals.csrfToken).toBe(token);
  });
});
