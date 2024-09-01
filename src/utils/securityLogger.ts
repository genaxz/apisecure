import { getConfig, updateConfig } from "./config";
import fs from "fs";
import path from "path";

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

export class SecurityLogger {
  private static instance: SecurityLogger;
  private logFile: string | null = null;

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  public setLogFile(filePath: string): void {
    this.logFile = path.resolve(filePath);
  }

  public log(level: LogLevel, message: string, meta?: any): void {
    try {
      const config = getConfig();
      if (level >= config.logLevel) {
        const timestamp = new Date().toISOString();
        const sanitizedMeta = this.sanitize(meta);
        const logEntry = {
          timestamp,
          level: LogLevel[level],
          message,
          meta: sanitizedMeta,
        };

        const formattedLog = `[${timestamp}] ${LogLevel[level]}: ${message}`;
        console.log(
          formattedLog,
          sanitizedMeta ? JSON.stringify(sanitizedMeta) : ""
        );

        if (this.logFile) {
          fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + "\n");
        }
      }
    } catch (error: unknown) {
      console.error(
        "Logging failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  public setLogLevel(level: LogLevel): void {
    updateConfig({ logLevel: level });
  }

  private sanitize(data: any): any {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private isSensitiveField(field: string): boolean {
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "api_key",
      "apikey",
      "access_token",
      "refresh_token",
      "private_key",
      "session_id",
    ];
    return sensitiveFields.some(
      (sensitive) =>
        field.toLowerCase() === sensitive ||
        field.toLowerCase().endsWith("_" + sensitive) ||
        field.toLowerCase().startsWith(sensitive + "_")
    );
  }

  public debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  public info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  public error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }
}

export const logger = SecurityLogger.getInstance();
