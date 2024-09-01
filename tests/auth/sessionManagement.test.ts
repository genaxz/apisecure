import {
  InMemorySessionStore,
  SessionManager,
  Session,
} from "../../src/auth/sessionManagement";
import { Request, Response, NextFunction } from "express";
import { RateLimiter } from "../../src/protection/rateLimiter";
import { getConfig } from "../../src/utils/config";

jest.mock("../../src/protection/rateLimiter");
jest.mock("../../src/utils/config", () => ({
  getConfig: jest.fn(() => ({
    sessionTTL: 1000,
    jwtSecret: "test-secret-not-to-be-used-in-production",
  })),
  updateConfig: jest.fn(),
}));

describe("Session Management", () => {
  let sessionStore: InMemorySessionStore;
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionStore = new InMemorySessionStore();
    sessionManager = new SessionManager(sessionStore);
    (RateLimiter.prototype.tryAcquire as jest.Mock).mockReturnValue(true);
  });

  test("createSession creates a new session", async () => {
    const session = await sessionManager.createSession("user123", {
      role: "admin",
    });
    expect(session.userId).toBe("user123");
    expect(session.data.role).toBe("admin");
  });

  test("getSession retrieves an existing session", async () => {
    const createdSession = await sessionManager.createSession("user123");
    const retrievedSession = await sessionManager.getSession(createdSession.id);
    expect(retrievedSession).toEqual(createdSession);
  });

  test("updateSession updates session data", async () => {
    const session = await sessionManager.createSession("user123");
    await sessionManager.updateSession(session.id, { newData: "value" });
    const updatedSession = await sessionManager.getSession(session.id);
    expect(updatedSession?.data.newData).toBe("value");
  });

  test("deleteSession removes a session", async () => {
    const session = await sessionManager.createSession("user123");
    await sessionManager.deleteSession(session.id);
    const deletedSession = await sessionManager.getSession(session.id);
    expect(deletedSession).toBeNull();
  });

  test("expired sessions are automatically removed", async () => {
    const session = await sessionManager.createSession("user123");
    await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for session to expire
    const expiredSession = await sessionManager.getSession(session.id);
    expect(expiredSession).toBeNull();
  });

  test("refreshSession extends session expiration", async () => {
    const session = await sessionManager.createSession("user123");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait half the expiration time
    await sessionManager.refreshSession(session.id);
    await new Promise((resolve) => setTimeout(resolve, 700)); // Wait a bit more
    const refreshedSession = await sessionManager.getSession(session.id);
    expect(refreshedSession).not.toBeNull();
  });

  test("middleware attaches session to request and refreshes it", async () => {
    const session = await sessionManager.createSession("user123");
    const initialExpiresAt = session.expiresAt;

    // Wait a small amount of time to ensure the expiration time will be different
    await new Promise((resolve) => setTimeout(resolve, 10));

    const req = { cookies: { sessionId: session.id } } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await sessionManager.middleware()(req, res, next);

    expect(req.session).toBeDefined();
    expect(req.session).not.toBeNull();
    expect((req.session as Session).id).toBe(session.id);
    expect(next).toHaveBeenCalled();

    const refreshedSession = await sessionManager.getSession(session.id);
    expect(refreshedSession).not.toBeNull();
    expect(refreshedSession!.expiresAt).toBeGreaterThan(initialExpiresAt);

    // Check if the expiration time has been extended by approximately sessionTTL
    const config = getConfig();
    const expectedNewExpiresAt = Date.now() + config.sessionTTL;
    expect(refreshedSession!.expiresAt).toBeCloseTo(expectedNewExpiresAt, -2); // Allow 10ms tolerance
  });

  test("rate limiting prevents excessive session creation", async () => {
    (RateLimiter.prototype.tryAcquire as jest.Mock).mockReturnValue(false);
    await expect(sessionManager.createSession("user123")).rejects.toThrow(
      "Rate limit exceeded"
    );
  });

  test("cleanup removes expired sessions", async () => {
    const session1 = await sessionManager.createSession("user1");
    const session2 = await sessionManager.createSession("user2");

    // Manually expire session1
    (sessionStore as any).sessions.get(session1.id).expiresAt =
      Date.now() - 1000;

    await sessionStore.cleanup();

    const retrievedSession1 = await sessionManager.getSession(session1.id);
    const retrievedSession2 = await sessionManager.getSession(session2.id);

    expect(retrievedSession1).toBeNull();
    expect(retrievedSession2).not.toBeNull();
  });
});
