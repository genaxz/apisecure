import { Request, Response } from "express";
import { EncryptionUtils } from "./encryptionUtils";
import { getConfig } from "./config";

export interface CookieOptions {
  maxAge?: number;
  signed?: boolean;
  expires?: Date;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
}

export class CookieManager {
  private encryptionUtils: EncryptionUtils;
  private config: ReturnType<typeof getConfig>;

  constructor() {
    this.encryptionUtils = new EncryptionUtils();
    this.config = getConfig();
  }

  setCookie(
    res: Response,
    name: string,
    value: string,
    options: CookieOptions = {}
  ): void {
    const encryptedValue = this.encryptionUtils.encrypt(value);
    const defaultOptions: CookieOptions = {
      httpOnly: true,
      secure: this.config.environment === "production",
      sameSite: "strict",
      maxAge: this.config.cookieMaxAge,
    };

    const cookieOptions = { ...defaultOptions, ...options };
    res.cookie(name, encryptedValue, cookieOptions);
  }

  getCookie(req: Request, name: string): string | null {
    const encryptedValue = req.cookies[name];
    if (!encryptedValue) {
      return null;
    }

    try {
      return this.encryptionUtils.decrypt(encryptedValue);
    } catch (error) {
      console.error(`Error decrypting cookie ${name}:`, error);
      return null;
    }
  }

  clearCookie(res: Response, name: string, options: CookieOptions = {}): void {
    res.clearCookie(name, options);
  }

  setSecureSessionCookie(res: Response, sessionData: object): void {
    const sessionString = JSON.stringify(sessionData);
    this.setCookie(res, "session", sessionString, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }

  getSecureSessionCookie(req: Request): object | null {
    const sessionString = this.getCookie(req, "session");
    if (!sessionString) {
      return null;
    }

    try {
      return JSON.parse(sessionString);
    } catch (error) {
      console.error("Error parsing session cookie:", error);
      return null;
    }
  }
}
