import { SecureHeaders } from "../../src/headers/secureHeaders";
import { Response } from "express";

describe("Secure Headers", () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      setHeader: jest.fn(),
    };
  });

  test("set method sets all expected headers", () => {
    SecureHeaders.set(mockResponse as Response);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Strict-Transport-Security",
      expect.any(String)
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "X-Frame-Options",
      "SAMEORIGIN"
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "X-XSS-Protection",
      "1; mode=block"
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "X-Content-Type-Options",
      "nosniff"
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Content-Security-Policy",
      expect.any(String)
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Feature-Policy",
      expect.any(String)
    );
  });

  test("Strict-Transport-Security header is set correctly", () => {
    SecureHeaders.set(mockResponse as Response);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  });

  test("Content-Security-Policy header is set correctly", () => {
    SecureHeaders.set(mockResponse as Response);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );
  });
});
