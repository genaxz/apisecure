import validator from "validator";
import { encode } from "html-entities";

export interface Validator {
  validate(input: string): boolean;
}

export interface Sanitizer<T> {
  sanitize(input: string): T;
}

export class EmailValidator implements Validator {
  validate(input: string): boolean {
    return validator.isEmail(input);
  }
}

export class UrlValidator implements Validator {
  validate(input: string): boolean {
    return validator.isURL(input);
  }
}

export class StringSanitizer implements Sanitizer<string> {
  private maxLength: number;

  constructor(maxLength: number = 255) {
    if (maxLength <= 0) {
      throw new Error("maxLength must be greater than 0");
    }
    this.maxLength = maxLength;
  }

  sanitize(input: string): string {
    const trimmed = input.trim();
    const escaped = encode(trimmed);
    return escaped.substring(0, this.maxLength);
  }
}

export class NumberSanitizer implements Sanitizer<number | null> {
  private min: number;
  private max: number;

  constructor(
    min: number = Number.MIN_SAFE_INTEGER,
    max: number = Number.MAX_SAFE_INTEGER
  ) {
    if (min > max) {
      throw new Error("min must be less than or equal to max");
    }
    this.min = min;
    this.max = max;
  }

  sanitize(input: string): number | null {
    const num = Number(input);
    if (isNaN(num)) return null;
    return Math.min(Math.max(num, this.min), this.max);
  }
}

export class BooleanSanitizer implements Sanitizer<boolean | null> {
  sanitize(input: string): boolean | null {
    input = input.toLowerCase().trim();
    if (["true", "1", "yes", "on"].includes(input)) return true;
    if (["false", "0", "no", "off"].includes(input)) return false;
    return null;
  }
}

export class AlphanumericValidator implements Validator {
  validate(input: string): boolean {
    return validator.isAlphanumeric(input);
  }
}

export class LengthValidator implements Validator {
  private minLength: number;
  private maxLength: number;

  constructor(minLength: number, maxLength: number) {
    if (minLength < 0 || maxLength < minLength) {
      throw new Error("Invalid length range");
    }
    this.minLength = minLength;
    this.maxLength = maxLength;
  }

  validate(input: string): boolean {
    return validator.isLength(input, {
      min: this.minLength,
      max: this.maxLength,
    });
  }
}

export class RegexValidator implements Validator {
  private regex: RegExp;

  constructor(regex: RegExp) {
    this.regex = regex;
  }

  validate(input: string): boolean {
    return this.regex.test(input);
  }
}

export class InputProcessorFactory {
  static createValidator(type: "email" | "url" | "alphanumeric"): Validator {
    switch (type) {
      case "email":
        return new EmailValidator();
      case "url":
        return new UrlValidator();
      case "alphanumeric":
        return new AlphanumericValidator();
      default:
        throw new Error(`Unsupported validator type: ${type}`);
    }
  }

  static createSanitizer(type: "string"): Sanitizer<string>;
  static createSanitizer(type: "number"): Sanitizer<number | null>;
  static createSanitizer(type: "boolean"): Sanitizer<boolean | null>;
  static createSanitizer(
    type: "string" | "number" | "boolean"
  ): Sanitizer<string | number | boolean | null> {
    switch (type) {
      case "string":
        return new StringSanitizer();
      case "number":
        return new NumberSanitizer();
      case "boolean":
        return new BooleanSanitizer();
      default:
        throw new Error(`Unsupported sanitizer type: ${type}`);
    }
  }
}

export function sanitizeArray<T>(
  input: string[],
  sanitizer: Sanitizer<T>
): T[] {
  return input
    .map((item) => sanitizer.sanitize(item))
    .filter((item): item is NonNullable<T> => item !== null);
}

export class InputValidator {
  static validate(input: string, validators: Validator[]): boolean {
    return validators.every((v) => v.validate(input));
  }

  static sanitize<T>(input: string, sanitizer: Sanitizer<T>): T {
    return sanitizer.sanitize(input);
  }
}

// DoS prevention utility
export function truncateInput(
  input: string,
  maxLength: number = 1000,
  suffix: string = "..."
): string {
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength - suffix.length) + suffix;
}
