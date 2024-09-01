import crypto from "crypto";
import { getConfig } from "./config";

interface CipherWithAuthTag extends crypto.Cipher {
  getAuthTag(): Buffer;
}

interface DecipherWithAuthTag extends crypto.Decipher {
  setAuthTag(buffer: Buffer): void;
}

export class EncryptionUtils {
  private algorithm: string;
  private secretKey: Buffer;
  private ivLength: number;

  constructor() {
    const config = getConfig();
    this.algorithm = "aes-256-gcm";
    this.secretKey = crypto.scryptSync(config.encryptionSecret, "salt", 32);
    this.ivLength = 16;
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.secretKey,
      iv
    ) as CipherWithAuthTag;

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return iv.toString("hex") + ":" + encrypted + ":" + authTag.toString("hex");
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encryptedHex, authTagHex] = encryptedText.split(":");

    if (!ivHex || !encryptedHex || !authTagHex) {
      throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      iv
    ) as DecipherWithAuthTag;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    return { publicKey, privateKey };
  }

  asymmetricEncrypt(text: string, publicKey: string): string {
    const buffer = Buffer.from(text, "utf8");
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString("base64");
  }

  asymmetricDecrypt(encryptedText: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedText, "base64");
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString("utf8");
  }
}
