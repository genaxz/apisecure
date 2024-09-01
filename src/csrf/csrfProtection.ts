import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { SecurityLibraryError } from "../utils/customError";
import { globalLogger } from "../utils/logger";

export class CsrfError extends SecurityLibraryError {
  constructor(message: string) {
    super(message, 403);
    this.name = "CsrfError";
  }
}

interface CsrfOptions {
  tokenLength: number;
  cookieName: string;
  headerName: string;
  cookieOptions: {
    httpOnly: boolean;
    sameSite: boolean | "lax" | "strict" | "none";
    secure: boolean;
    maxAge?: number;
  };
}

export class CsrfProtector {
  private options: CsrfOptions;

  constructor(options: Partial<CsrfOptions> = {}) {
    const defaultOptions: CsrfOptions = {
      tokenLength: 32,
      cookieName: "XSRF-TOKEN",
      headerName: "X-XSRF-TOKEN",
      cookieOptions: {
        httpOnly: false,
        sameSite: "strict",
        secure: true,
        maxAge: 3600000, // 1 hour
      },
    };
    this.options = { ...defaultOptions, ...options };
  }

  generateToken(): string {
    const token = crypto.randomBytes(this.options.tokenLength).toString("hex");
    globalLogger.info("Generated CSRF token");
    return token;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (req.method === "GET") {
        const token = this.generateToken();
        this.setCookie(res, token);
        res.locals.csrfToken = token;
      } else {
        const cookieToken = this.getCookie(req, this.options.cookieName);
        const headerToken = req.header(this.options.headerName);

        if (!cookieToken || !headerToken || cookieToken !== headerToken) {
          const error = new CsrfError("CSRF token validation failed");
          globalLogger.warn("CSRF token validation failed", {
            method: req.method,
            path: req.path,
          });
          res.status(403).json({ error: error.message });
          return;
        }

        // Generate a new token for the next request
        const newToken = this.generateToken();
        this.setCookie(res, newToken);
        res.locals.csrfToken = newToken;
      }
      next();
    };
  }

  attachCsrfToken(req: Request, res: Response): string {
    if (!res.locals.csrfToken) {
      const token = this.generateToken();
      this.setCookie(res, token);
      res.locals.csrfToken = token;
    }
    return res.locals.csrfToken;
  }

  private setCookie(res: Response, token: string): void {
    if (typeof res.cookie === "function") {
      res.cookie(this.options.cookieName, token, this.options.cookieOptions);
    } else {
      const cookieString = this.constructCookieString(token);
      res.setHeader("Set-Cookie", cookieString);
    }
    globalLogger.info("Set CSRF token cookie");
  }

  private getCookie(req: Request, name: string): string | undefined {
    if (req.cookies) {
      return req.cookies[name];
    }
    const cookies = req.headers.cookie?.split(";").map((c) => c.trim());
    const cookie = cookies?.find((c) => c.startsWith(`${name}=`));
    return cookie ? cookie.split("=")[1] : undefined;
  }

  private constructCookieString(token: string): string {
    const { cookieName, cookieOptions } = this.options;
    let cookieString = `${cookieName}=${token}; HttpOnly=${cookieOptions.httpOnly}; SameSite=${cookieOptions.sameSite}`;
    if (cookieOptions.secure) cookieString += "; Secure";
    if (cookieOptions.maxAge)
      cookieString += `; Max-Age=${cookieOptions.maxAge}`;
    return cookieString;
  }
}
