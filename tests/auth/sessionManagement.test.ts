import {
  InMemorySessionStore,
  SessionManager,
} from "../../src/auth/sessionManagement";
import { updateConfig } from "../../src/utils/config";
import { Request, Response, NextFunction } from "express";

describe("Session Management", () => {
  let sessionStore: InMemorySessionStore;
  let sessionManager: SessionManager;

  beforeEach(() => {
    updateConfig({ sessionTTL: 1000 }); // 1 second for testing
    sessionStore = new InMemorySessionStore();
    sessionManager = new SessionManager(sessionStore);
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

  test("middleware attaches session to request", async () => {
    const session = await sessionManager.createSession("user123");
    const req = { cookies: { sessionId: session.id } } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await sessionManager.middleware()(req, res, next);

    expect(req.session).toEqual(session);
    expect(next).toHaveBeenCalled();
  });

  test("middleware attaches session to request", async () => {
    const session = await sessionManager.createSession("user123");
    const req = { cookies: { sessionId: session.id } } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await sessionManager.middleware()(req, res, next);

    expect(req.session).toEqual(session);
    expect(next).toHaveBeenCalled();
  });
});
