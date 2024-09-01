// API Security Library

export const version = "0.1.0";

export {
  Validator,
  Sanitizer,
  EmailValidator,
  UrlValidator,
  StringSanitizer,
  NumberSanitizer,
  BooleanSanitizer,
  InputProcessorFactory,
  sanitizeArray,
} from "./input/inputValidation";

export {
  SqlInjectionError,
  SqlInjectionPreventer,
} from "./sql/sqlInjectionPrevention";

export { SecurityLibraryError } from "./utils/customError";

export { XssProtector, CspOptions } from "./xss/xssProtection";

export { CsrfError, CsrfProtector } from "./csrf/csrfProtection";

export { User, JwtPayload, AuthHelpers } from "./auth/authHelpers";
export { SecureHeaders } from "./headers/secureHeaders";

export { SecurityLogger, LogLevel, logger } from "./utils/securityLogger";

export {
  SecurityConfig,
  ConfigManager,
  getConfig,
  updateConfig,
} from "./utils/config";

export {
  Session,
  SessionStore,
  InMemorySessionStore,
  SessionManager,
} from "./auth/sessionManagement";

export { RateLimiter, BruteForceProtection } from "./protection/rateLimiter";

export {
  PasswordPolicyConfig,
  PasswordPolicyEnforcer,
} from "./auth/passwordPolicy";

export { PasswordResetToken, PasswordResetManager } from "./auth/passwordReset";

export { TwoFactorSecret, TwoFactorAuthManager } from "./auth/twoFactorAuth";
export { EncryptionUtils } from "./utils/encryptionUtils";
export { CookieManager, CookieOptions } from "./utils/cookieManager";
