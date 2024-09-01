import { CookieManager } from "../../src/utils/cookieManager";
import { EncryptionUtils } from "../../src/utils/encryptionUtils";
import { Request, Response } from "express";

jest.mock("../../src/utils/encryptionUtils");
jest.mock("../../src/utils/config", () => ({
  getConfig: jest.fn(() => ({
    environment: "development",
    cookieMaxAge: 604800000, // 7 days
  })),
}));

describe("Cookie Manager", () => {
  let cookieManager: CookieManager;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    cookieManager = new CookieManager();
    mockRequest = {
      cookies: {},
    };
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    (EncryptionUtils.prototype.encrypt as jest.Mock).mockImplementation(
      (value) => `encrypted_${value}`
    );
    (EncryptionUtils.prototype.decrypt as jest.Mock).mockImplementation(
      (value) => value.replace("encrypted_", "")
    );
  });

  test("setCookie encrypts value and sets cookie", () => {
    cookieManager.setCookie(
      mockResponse as Response,
      "testCookie",
      "testValue"
    );

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      "testCookie",
      "encrypted_testValue",
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 604800000,
      })
    );
  });

  test("getCookie decrypts and returns cookie value", () => {
    mockRequest.cookies = { testCookie: "encrypted_testValue" };

    const value = cookieManager.getCookie(mockRequest as Request, "testCookie");

    expect(value).toBe("testValue");
  });

  test("clearCookie calls response.clearCookie", () => {
    cookieManager.clearCookie(mockResponse as Response, "testCookie");

    expect(mockResponse.clearCookie).toHaveBeenCalledWith("testCookie", {});
  });

  test("setSecureSessionCookie sets encrypted session cookie", () => {
    const sessionData = { userId: "123", role: "admin" };

    cookieManager.setSecureSessionCookie(mockResponse as Response, sessionData);

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      "session",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      })
    );
  });

  test("getSecureSessionCookie retrieves and parses session data", () => {
    const sessionData = { userId: "123", role: "admin" };
    mockRequest.cookies = {
      session: "encrypted_" + JSON.stringify(sessionData),
    };

    const retrievedSession = cookieManager.getSecureSessionCookie(
      mockRequest as Request
    );

    expect(retrievedSession).toEqual(sessionData);
  });
});
