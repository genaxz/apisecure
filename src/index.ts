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
  SqlEscaper,
  DefaultSqlEscaper,
  SqlSanitizer,
  DefaultSqlSanitizer,
  SqlQueryBuilder,
  SqlBuilder,
  createParameterizedQuery,
} from "./sql/sqlInjectionPrevention";

export {
  HtmlEncoder,
  DefaultHtmlEncoder,
  ScriptSanitizer,
  DefaultScriptSanitizer,
  CspHeaderGenerator,
  DefaultCspHeaderGenerator,
  XssProtection,
} from "./xss/xssProtection";

export {
  TokenGenerator,
  DefaultTokenGenerator,
  TokenStorage,
  MemoryTokenStorage,
  CsrfProtection,
  CsrfRequest,
  CsrfResponse,
} from "./csrf/csrfProtection";

export { User, JwtPayload, AuthHelpers, AuthError } from "./auth/authHelpers";
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
