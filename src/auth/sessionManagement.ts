import { randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";
import { getConfig } from "../utils/config";

declare module "express-serve-static-core" {
  interface Request {
    session?: Session;
  }
}

export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  data: { [key: string]: any };
}

export interface SessionStore {
  create(userId: string, data: { [key: string]: any }): Promise<Session>;
  get(sessionId: string): Promise<Session | null>;
  update(sessionId: string, data: { [key: string]: any }): Promise<void>;
  delete(sessionId: string): Promise<void>;
  cleanup(): Promise<void>;
}

export class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();

  async create(userId: string, data: { [key: string]: any }): Promise<Session> {
    const config = getConfig();
    const sessionId = randomBytes(32).toString("hex");
    const now = Date.now();
    const session: Session = {
      id: sessionId,
      userId,
      createdAt: now,
      expiresAt: now + config.sessionTTL,
      data,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  async get(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      await this.delete(sessionId);
      return null;
    }
    return session;
  }

  async update(sessionId: string, data: { [key: string]: any }): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      session.data = { ...session.data, ...data };
      this.sessions.set(sessionId, session);
    }
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export class SessionManager {
  private store: SessionStore;

  constructor(store: SessionStore = new InMemorySessionStore()) {
    this.store = store;
  }

  createSession(
    userId: string,
    data: { [key: string]: any } = {}
  ): Promise<Session> {
    return this.store.create(userId, data);
  }

  getSession(sessionId: string): Promise<Session | null> {
    return this.store.get(sessionId);
  }

  updateSession(
    sessionId: string,
    data: { [key: string]: any }
  ): Promise<void> {
    return this.store.update(sessionId, data);
  }

  deleteSession(sessionId: string): Promise<void> {
    return this.store.delete(sessionId);
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        const session = await this.getSession(sessionId);
        if (session) {
          req.session = session;
        }
      }
      next();
    };
  }
}
