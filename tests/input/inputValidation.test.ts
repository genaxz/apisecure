import {
  EmailValidator,
  UrlValidator,
  StringSanitizer,
  NumberSanitizer,
  BooleanSanitizer,
  AlphanumericValidator,
  LengthValidator,
  RegexValidator,
  InputProcessorFactory,
  sanitizeArray,
  InputValidator,
  truncateInput,
} from "../../src/input/inputValidation";

describe("Input Validation", () => {
  describe("EmailValidator", () => {
    const validator = new EmailValidator();

    test("validates correct email", () => {
      expect(validator.validate("test@example.com")).toBe(true);
    });

    test("invalidates incorrect email", () => {
      expect(validator.validate("not-an-email")).toBe(false);
    });
  });

  describe("UrlValidator", () => {
    const validator = new UrlValidator();

    test("validates correct URL", () => {
      expect(validator.validate("https://www.example.com")).toBe(true);
    });

    test("invalidates incorrect URL", () => {
      expect(validator.validate("not-a-url")).toBe(false);
    });
  });

  describe("StringSanitizer", () => {
    const sanitizer = new StringSanitizer(10);

    test("trims and escapes string", () => {
      expect(sanitizer.sanitize(' <script>alert("XSS")</script> ')).toBe(
        "&lt;script"
      );
    });

    test("truncates string to max length", () => {
      expect(sanitizer.sanitize("a".repeat(20))).toBe("a".repeat(10));
    });

    test("throws error for invalid maxLength", () => {
      expect(() => new StringSanitizer(0)).toThrow(
        "maxLength must be greater than 0"
      );
      expect(() => new StringSanitizer(-1)).toThrow(
        "maxLength must be greater than 0"
      );
    });
  });

  describe("NumberSanitizer", () => {
    const sanitizer = new NumberSanitizer(0, 100);

    test("converts valid number", () => {
      expect(sanitizer.sanitize("50")).toBe(50);
    });

    test("clamps number to min/max", () => {
      expect(sanitizer.sanitize("-10")).toBe(0);
      expect(sanitizer.sanitize("200")).toBe(100);
    });

    test("returns null for invalid number", () => {
      expect(sanitizer.sanitize("not-a-number")).toBe(null);
    });

    test("throws error for invalid min/max", () => {
      expect(() => new NumberSanitizer(100, 0)).toThrow(
        "min must be less than or equal to max"
      );
    });
  });

  describe("BooleanSanitizer", () => {
    const sanitizer = new BooleanSanitizer();

    test("converts truthy values", () => {
      expect(sanitizer.sanitize("true")).toBe(true);
      expect(sanitizer.sanitize("1")).toBe(true);
      expect(sanitizer.sanitize("yes")).toBe(true);
    });

    test("converts falsy values", () => {
      expect(sanitizer.sanitize("false")).toBe(false);
      expect(sanitizer.sanitize("0")).toBe(false);
      expect(sanitizer.sanitize("no")).toBe(false);
    });

    test("returns null for invalid boolean", () => {
      expect(sanitizer.sanitize("not-a-boolean")).toBe(null);
    });
  });

  describe("AlphanumericValidator", () => {
    const validator = new AlphanumericValidator();

    test("validates alphanumeric string", () => {
      expect(validator.validate("abc123")).toBe(true);
    });

    test("invalidates non-alphanumeric string", () => {
      expect(validator.validate("abc_123")).toBe(false);
    });
  });

  describe("LengthValidator", () => {
    const validator = new LengthValidator(5, 10);

    test("validates string within length range", () => {
      expect(validator.validate("abcdef")).toBe(true);
    });

    test("invalidates string outside length range", () => {
      expect(validator.validate("abcd")).toBe(false);
      expect(validator.validate("abcdefghijk")).toBe(false);
    });

    test("throws error for invalid length range", () => {
      expect(() => new LengthValidator(-1, 10)).toThrow("Invalid length range");
      expect(() => new LengthValidator(10, 5)).toThrow("Invalid length range");
    });
  });

  describe("RegexValidator", () => {
    const validator = new RegexValidator(/^[A-Z]{3}-\d{3}$/);

    test("validates string matching regex", () => {
      expect(validator.validate("ABC-123")).toBe(true);
    });

    test("invalidates string not matching regex", () => {
      expect(validator.validate("ABC-12")).toBe(false);
    });
  });

  describe("InputProcessorFactory", () => {
    test("creates correct validator", () => {
      expect(InputProcessorFactory.createValidator("email")).toBeInstanceOf(
        EmailValidator
      );
      expect(InputProcessorFactory.createValidator("url")).toBeInstanceOf(
        UrlValidator
      );
      expect(
        InputProcessorFactory.createValidator("alphanumeric")
      ).toBeInstanceOf(AlphanumericValidator);
    });

    test("creates correct sanitizer", () => {
      expect(InputProcessorFactory.createSanitizer("string")).toBeInstanceOf(
        StringSanitizer
      );
      expect(InputProcessorFactory.createSanitizer("number")).toBeInstanceOf(
        NumberSanitizer
      );
      expect(InputProcessorFactory.createSanitizer("boolean")).toBeInstanceOf(
        BooleanSanitizer
      );
    });

    test("throws error for unsupported types", () => {
      expect(() =>
        InputProcessorFactory.createValidator("unsupported" as any)
      ).toThrow();
      expect(() =>
        InputProcessorFactory.createSanitizer("unsupported" as any)
      ).toThrow();
    });
  });

  describe("sanitizeArray", () => {
    test("sanitizes array of values", () => {
      const sanitizer = new NumberSanitizer(0, 100);
      expect(
        sanitizeArray(["10", "50", "not-a-number", "200"], sanitizer)
      ).toEqual([10, 50, 100]);
    });

    test("filters out null values", () => {
      const sanitizer = new NumberSanitizer(0, 100);
      expect(
        sanitizeArray(["10", "not-a-number", "50", "invalid"], sanitizer)
      ).toEqual([10, 50]);
    });
  });

  describe("InputValidator", () => {
    test("validates input with multiple validators", () => {
      const validators = [
        new LengthValidator(5, 10),
        new AlphanumericValidator(),
      ];
      expect(InputValidator.validate("abc123", validators)).toBe(true);
      expect(InputValidator.validate("abc", validators)).toBe(false);
      expect(InputValidator.validate("abc_123", validators)).toBe(false);
    });

    test("sanitizes input", () => {
      const sanitizer = new StringSanitizer(5);
      expect(InputValidator.sanitize("  abcdef  ", sanitizer)).toBe("abcde");
    });
  });

  describe("truncateInput", () => {
    test("truncates input to specified length", () => {
      expect(truncateInput("abcdefghij", 5)).toBe("ab...");
    });

    test("does not modify input shorter than max length", () => {
      expect(truncateInput("abc", 5)).toBe("abc");
    });

    test("uses default max length if not specified", () => {
      const longInput = "a".repeat(2000);
      expect(truncateInput(longInput).length).toBe(1000);
    });

    test("uses custom suffix", () => {
      expect(truncateInput("abcdefghij", 7, "***")).toBe("abcd***");
    });
  });
});
