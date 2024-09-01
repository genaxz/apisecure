import { Response } from "express";

export class SecureHeaders {
  static set(res: Response): void {
    // HTTP Strict Transport Security
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );

    // X-Frame-Options
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // X-XSS-Protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // X-Content-Type-Options
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Referrer-Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content-Security-Policy
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );

    // Feature-Policy
    res.setHeader(
      "Feature-Policy",
      "geolocation 'none'; microphone 'none'; camera 'none'"
    );
  }
}
