import { EncryptionUtils } from "../../src/utils/encryptionUtils";
import { updateConfig } from "../../src/utils/config";

jest.mock("../../src/utils/config", () => ({
  getConfig: jest.fn(() => ({
    encryptionSecret: "test-encryption-secret",
  })),
  updateConfig: jest.fn(),
}));

describe("Encryption Utils", () => {
  let encryptionUtils: EncryptionUtils;

  beforeEach(() => {
    encryptionUtils = new EncryptionUtils();
  });

  test("encrypts and decrypts text correctly", () => {
    const originalText = "Hello, World!";
    const encryptedText = encryptionUtils.encrypt(originalText);
    const decryptedText = encryptionUtils.decrypt(encryptedText);

    expect(decryptedText).toBe(originalText);
  });

  test("generates different ciphertexts for the same plaintext", () => {
    const plaintext = "Hello, World!";
    const ciphertext1 = encryptionUtils.encrypt(plaintext);
    const ciphertext2 = encryptionUtils.encrypt(plaintext);

    expect(ciphertext1).not.toBe(ciphertext2);
  });

  test("throws error when decrypting invalid ciphertext", () => {
    expect(() => {
      encryptionUtils.decrypt("invalid:ciphertext:format");
    }).toThrow();
  });

  test("generates key pair for asymmetric encryption", () => {
    const { publicKey, privateKey } = encryptionUtils.generateKeyPair();
    expect(publicKey).toBeTruthy();
    expect(privateKey).toBeTruthy();
  });

  test("encrypts and decrypts using asymmetric encryption", () => {
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
  test("throws error when decrypting invalid ciphertext", () => {
    expect(() => {
      encryptionUtils.decrypt("invalid:ciphertext:format");
    }).toThrow("Invalid encrypted text format");

    expect(() => {
      encryptionUtils.decrypt("invalid");
    }).toThrow("Invalid encrypted text format");
  });
});
