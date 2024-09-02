# Two-Factor Authentication

The `TwoFactorAuthManager` class provides functionality for implementing Time-based One-Time Password (TOTP) two-factor authentication in your application.

## Features

- TOTP secret generation
- Token verification
- Backup codes generation and management
- QR code URL generation for easy setup with authenticator apps

## Usage

```typescript
import { TwoFactorAuthManager } from "apisecure";

const twoFactorAuth = new TwoFactorAuthManager();

// Generate a new 2FA secret for a user
const userId = "user123";
const secret = twoFactorAuth.generateSecret(userId);

// Get the QR code URL for the user to scan with their authenticator app
const qrCodeUrl = twoFactorAuth.getQRCodeUrl(userId, "YourAppName");

// Verify a token
const isValid = twoFactorAuth.verifyToken(userId, "123456");

// Use a backup code
const isValidBackupCode = twoFactorAuth.useBackupCode(userId, "backup123");
```

## API Reference

### `TwoFactorAuthManager`

#### `generateSecret(userId: string): TwoFactorSecret`

Generates a new TOTP secret and backup codes for a user.

#### `verifyToken(userId: string, token: string): boolean`

Verifies a TOTP token for a user.

#### `useBackupCode(userId: string, code: string): boolean`

Verifies and consumes a backup code for a user.

#### `getQRCodeUrl(userId: string, appName: string): string`

Generates a QR code URL for easy setup with authenticator apps.

## Best Practices

1. Store TOTP secrets securely, preferably encrypted at rest.
2. Implement rate limiting on token verification attempts to prevent brute-force attacks.
3. Provide clear instructions for users on how to set up and use 2FA.
4. Offer backup codes and educate users on their importance and proper storage.
5. Consider allowing users to regenerate their 2FA secret if needed (e.g., if they lose their device).
6. Implement account recovery options for users who lose access to their 2FA device and backup codes.
7. Use secure communication channels when sharing 2FA setup information with users.
8. Regularly audit and monitor 2FA usage and any failed attempts.

## Integration Example

Here's an example of how to integrate 2FA into your login process:

```typescript
import express from "express";
import { TwoFactorAuthManager, AuthHelpers } from "apisecure";

const app = express();
const twoFactorAuth = new TwoFactorAuthManager();
const authHelpers = new AuthHelpers();

app.post("/login", async (req, res) => {
  const { username, password, totpToken } = req.body;

  // First, verify username and password
  const user = await verifyCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // If 2FA is enabled for the user, verify the TOTP token
  if (user.twoFactorEnabled) {
    if (!totpToken) {
      return res.status(400).json({ error: "2FA token required" });
    }

    const isValidToken = twoFactorAuth.verifyToken(user.id, totpToken);
    if (!isValidToken) {
      return res.status(401).json({ error: "Invalid 2FA token" });
    }
  }

  // If everything is valid, create a session or JWT token
  const token = authHelpers.generateToken(user);
  res.json({ token });
});
```

[← Back to Auth Features Overview](./AuthFeaturesOverview.md)
