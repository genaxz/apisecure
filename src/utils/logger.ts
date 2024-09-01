import { getConfig } from "./config";

export enum LogLevel {
  ERROR,
  WARN,
  INFO,
  DEBUG,
}

class Logger {
  private config = getConfig();

  private log(level: LogLevel, message: string, meta?: any) {
    if (level <= this.config.logLevel) {
      const logMessage = {
        timestamp: new Date().toISOString(),
        level: LogLevel[level],
        message,
        meta: this.sanitize(meta),
      };
      console.log(JSON.stringify(logMessage));
    }
  }

  private sanitize(data: any): any {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    const sanitized: any = {};
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
    const sensitiveFields = ["password", "token", "secret", "key", "cookie"];
    return sensitiveFields.some((sensitive) =>
      field.toLowerCase().includes(sensitive)
    );
  }

  error(message: string, meta?: any) {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }
}

export const globalLogger = new Logger();
