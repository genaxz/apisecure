import {
  SecurityLogger,
  LogLevel,
  logger,
} from "../../src/utils/securityLogger";
import { getConfig, updateConfig } from "../../src/utils/config";

describe("SecurityLogger", () => {
  let originalConsoleLog: any;
  let mockConsoleLog: jest.Mock;

  beforeEach(() => {
    originalConsoleLog = console.log;
    mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;
    updateConfig({ logLevel: LogLevel.INFO });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  test("log method respects log level", () => {
    logger.log(LogLevel.INFO, "Info message");
    expect(mockConsoleLog).toHaveBeenCalled();

    mockConsoleLog.mockClear();
    updateConfig({ logLevel: LogLevel.ERROR });

    logger.log(LogLevel.WARN, "Warning message");
    expect(mockConsoleLog).not.toHaveBeenCalled();

    logger.log(LogLevel.ERROR, "Error message");
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  test("setLogLevel updates configuration", () => {
    logger.setLogLevel(LogLevel.ERROR);
    expect(getConfig().logLevel).toBe(LogLevel.ERROR);
  });

  test("log includes timestamp and level", () => {
    logger.log(LogLevel.INFO, "Test message");
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message$/
      ),
      ""
    );
  });

  test("log handles meta information", () => {
    const meta = { key: "value" };
    logger.log(LogLevel.INFO, "Test message", meta);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message$/
      ),
      JSON.stringify(meta)
    );
  });
});
