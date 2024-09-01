import {
  getConfig,
  updateConfig,
  SecurityConfig,
} from "../../src/utils/config";
import { LogLevel } from "../../src/utils/securityLogger";

describe("Configuration", () => {
  let originalConfig: SecurityConfig;

  beforeEach(() => {
    originalConfig = getConfig();
  });

  afterEach(() => {
    // Reset to original config after each test
    updateConfig(originalConfig);
  });

  test("getConfig returns default configuration", () => {
    const config = getConfig();
    expect(config.jwtSecret).toBeDefined();
    expect(config.jwtExpiresIn).toBe("1h");
    expect(config.bcryptSaltRounds).toBe(10);
    expect(config.csrfTokenLength).toBe(32);
    expect(config.logLevel).toBe(LogLevel.WARN);
  });

  test("updateConfig updates configuration", () => {
    updateConfig({
      jwtExpiresIn: "2h",
      bcryptSaltRounds: 12,
      logLevel: LogLevel.ERROR,
    });
    const config = getConfig();
    expect(config.jwtExpiresIn).toBe("2h");
    expect(config.bcryptSaltRounds).toBe(12);
    expect(config.logLevel).toBe(LogLevel.ERROR);
  });

  test("updateConfig does not affect unspecified properties", () => {
    const originalConfig = getConfig();
    updateConfig({ jwtExpiresIn: "2h" });
    const newConfig = getConfig();
    expect(newConfig.jwtExpiresIn).toBe("2h");
    expect(newConfig.bcryptSaltRounds).toBe(originalConfig.bcryptSaltRounds);
    expect(newConfig.csrfTokenLength).toBe(originalConfig.csrfTokenLength);
  });

  test("jwtSecret can be updated", () => {
    const newSecret = "new-secret-key";
    updateConfig({ jwtSecret: newSecret });
    expect(getConfig().jwtSecret).toBe(newSecret);
  });
});
