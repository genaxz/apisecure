import { XssProtector, CspOptions } from "../../src/xss/xssProtection";

describe("XSS Protection", () => {
  describe("sanitize", () => {
    test("removes script tags", () => {
      const xssProtector = new XssProtector();
      const input = '<script>alert("XSS")</script>';
      expect(xssProtector.sanitize(input)).not.toContain("<script>");
    });

    test("allows safe HTML", () => {
      const xssProtector = new XssProtector();
      const input = "<p>Hello, <strong>world</strong>!</p>";
      expect(xssProtector.sanitize(input)).toBe(input);
    });

    test("removes on* attributes", () => {
      const xssProtector = new XssProtector();
      const input = '<img src="x" onerror="alert(\'XSS\')">';
      expect(xssProtector.sanitize(input)).not.toContain("onerror");
    });

    test("respects custom DOMPurify config in constructor", () => {
      const xssProtector = new XssProtector({ ALLOWED_TAGS: ["p"] });
      const input = '<p>Hello</p><a href="#">Link</a>';
      expect(xssProtector.sanitize(input)).not.toContain("<a");
    });

    test("respects custom DOMPurify config in sanitize method", () => {
      const xssProtector = new XssProtector();
      const input = '<p>Hello</p><a href="#">Link</a>';
      const config = { ALLOWED_TAGS: ["a"] };
      expect(xssProtector.sanitize(input, config)).not.toContain("<p");
    });
  });

  describe("generateCspHeader", () => {
    let xssProtector: XssProtector;

    beforeEach(() => {
      xssProtector = new XssProtector();
    });

    const defaultOptions: CspOptions = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    };

    test("generates CSP header with required directives", () => {
      const cspHeader = xssProtector.generateCspHeader(defaultOptions);
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("style-src 'self'");
    });

    test("allows custom CSP directives", () => {
      const customOptions: CspOptions = {
        ...defaultOptions,
        scriptSrc: ["'self'", "https://trusted.com"],
        imgSrc: ["https:", "data:"],
      };
      const cspHeader = xssProtector.generateCspHeader(customOptions);
      expect(cspHeader).toContain("script-src 'self' https://trusted.com");
      expect(cspHeader).toContain("img-src https: data:");
    });

    test("includes default values for certain directives", () => {
      const cspHeader = xssProtector.generateCspHeader(defaultOptions);
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain("frame-src 'none'");
      expect(cspHeader).toContain("base-uri 'self'");
    });

    test("overrides default directives with custom ones", () => {
      const customOptions: CspOptions = {
        ...defaultOptions,
        objectSrc: ["'self'"],
        frameSrc: ["'self'"],
      };
      const cspHeader = xssProtector.generateCspHeader(customOptions);
      expect(cspHeader).toContain("object-src 'self'");
      expect(cspHeader).toContain("frame-src 'self'");
    });

    test("includes upgrade-insecure-requests directive", () => {
      const customOptions: CspOptions = {
        ...defaultOptions,
        upgradeInsecureRequests: true,
      };
      const cspHeader = xssProtector.generateCspHeader(customOptions);
      expect(cspHeader).toContain("upgrade-insecure-requests");
    });

    test("includes report-uri directive", () => {
      const customOptions: CspOptions = {
        ...defaultOptions,
        reportUri: "https://example.com/report",
      };
      const cspHeader = xssProtector.generateCspHeader(customOptions);
      expect(cspHeader).toContain("report-uri https://example.com/report");
    });
  });
});
