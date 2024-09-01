import crypto from "crypto";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { SecurityLibraryError } from "../utils/customError";
import { globalLogger } from "../utils/logger";

// Create a new JSDOM instance
const window = new JSDOM("").window;
// Create a DOMPurify instance using the JSDOM window
const DOMPurify = createDOMPurify(window as unknown as Window);

export interface CspOptions {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  baseUri?: string[];
  reportUri?: string;
  reportTo?: string;
  upgradeInsecureRequests?: boolean;
}

export class XssProtector {
  private defaultDOMPurifyConfig: DOMPurify.Config;

  constructor(domPurifyConfig: DOMPurify.Config = {}) {
    this.defaultDOMPurifyConfig = domPurifyConfig;
  }

  sanitize(
    input: string,
    config: DOMPurify.Config = {},
    contentType?: string
  ): string {
    try {
      if (contentType && !this.isSafeContentType(contentType)) {
        throw new SecurityLibraryError("Unsafe content type", 400);
      }

      const mergedConfig = { ...this.defaultDOMPurifyConfig, ...config };
      const sanitized = DOMPurify.sanitize(input, mergedConfig) as string;
      globalLogger.info("Content sanitized successfully");
      return sanitized;
    } catch (error) {
      globalLogger.error("Error during content sanitization", { error });
      throw new SecurityLibraryError("Content sanitization failed", 500);
    }
  }

  generateCspHeader(options: CspOptions): string {
    try {
      this.validateCspOptions(options);

      const defaultOptions: Partial<CspOptions> = {
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
      };

      const cspOptions = { ...defaultOptions, ...options };

      const directives = Object.entries(cspOptions)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (key === "upgradeInsecureRequests" && value === true) {
            return "upgrade-insecure-requests";
          }
          if (Array.isArray(value)) {
            return `${this.kebabCase(key)} ${value.join(" ")}`;
          }
          return `${this.kebabCase(key)} ${value}`;
        })
        .join("; ");

      globalLogger.info("CSP header generated successfully");
      return `Content-Security-Policy: ${directives}`;
    } catch (error) {
      globalLogger.error("Error generating CSP header", { error });
      throw new SecurityLibraryError("CSP header generation failed", 500);
    }
  }

  generateCspNonce(): string {
    return crypto.randomBytes(16).toString("base64");
  }

  private validateCspOptions(options: CspOptions): void {
    if (!options.defaultSrc || options.defaultSrc.length === 0) {
      throw new SecurityLibraryError("default-src directive is required", 400);
    }
    // Add more validations as needed
  }

  private kebabCase(str: string): string {
    return str
      .split(/(?=[A-Z])/)
      .join("-")
      .toLowerCase();
  }

  private isSafeContentType(contentType: string): boolean {
    const safeTypes = ["text/html", "text/plain", "application/json"];
    return safeTypes.includes(contentType.toLowerCase());
  }
}
