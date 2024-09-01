import { EncryptionUtils } from "../../src/utils/encryptionUtils";

jest.mock("../../src/utils/config", () => ({
  getConfig: jest.fn(() => ({
    encryptionSecret: "test-encryption-secret",
  })),
}));

describe("EncryptionUtils", () => {
  let encryptionUtils: EncryptionUtils;

  beforeEach(() => {
    encryptionUtils = new EncryptionUtils();
  });

  describe("Symmetric Encryption", () => {
    it("should encrypt and decrypt a string correctly", () => {
      const originalText = "Hello, World!";
      const encryptedText = encryptionUtils.encrypt(originalText);
      const decryptedText = encryptionUtils.decrypt(encryptedText);
      expect(decryptedText).toBe(originalText);
    });

    it("should throw an error when decrypting invalid text", () => {
      expect(() => {
        encryptionUtils.decrypt("invalid:encrypted:text");
      }).toThrow("Invalid encrypted text format");
    });

    it("should throw an error when decrypting with invalid format", () => {
      expect(() => {
        encryptionUtils.decrypt("invalidencryptedtext");
      }).toThrow("Invalid encrypted text format");
    });

    it("should throw an error when decrypting with invalid hex values", () => {
      expect(() => {
        encryptionUtils.decrypt("invalid:hex:values");
      }).toThrow("Invalid encrypted text format");
    });
  });

  describe("Asymmetric Encryption", () => {
    it("should generate a valid key pair", () => {
      const { publicKey, privateKey } = encryptionUtils.generateKeyPair();
      expect(publicKey).toContain("BEGIN PUBLIC KEY");
      expect(privateKey).toContain("BEGIN PRIVATE KEY");
    });

    it("should encrypt and decrypt using asymmetric encryption", () => {
      const { publicKey, privateKey } = encryptionUtils.generateKeyPair();
      const originalText = "Hello, Asymmetric World!";
      const encryptedText = encryptionUtils.asymmetricEncrypt(
        originalText,
        publicKey
      );
      const decryptedText = encryptionUtils.asymmetricDecrypt(
        encryptedText,
        privateKey
      );
      expect(decryptedText).toBe(originalText);
    });
  });
});
