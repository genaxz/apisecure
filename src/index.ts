// API Security Library

export const version = "0.1.0";

export {
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

export { XssProtector } from "./xss/xssProtection";

export { CsrfError, CsrfProtector } from "./csrf/csrfProtection";

export { AuthHelpers } from "./auth/authHelpers";
export { SecureHeaders } from "./headers/secureHeaders";

export { SecurityLogger, LogLevel, logger } from "./utils/securityLogger";

export { ConfigManager, getConfig, updateConfig } from "./utils/config";

export { InMemorySessionStore, SessionManager } from "./auth/sessionManagement";

export { RateLimiter, BruteForceProtection } from "./protection/rateLimiter";

export { PasswordPolicyEnforcer } from "./auth/passwordPolicy";

export { PasswordResetManager } from "./auth/passwordReset";

export { TwoFactorAuthManager } from "./auth/twoFactorAuth";
export { EncryptionUtils } from "./utils/encryptionUtils";
export { CookieManager } from "./utils/cookieManager";
