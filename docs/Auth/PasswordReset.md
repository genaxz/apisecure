# Password Reset

The `PasswordResetManager` class provides functionality for secure password reset operations.

## Features

- Secure reset token generation
- Token verification
- Password reset with policy enforcement

## Usage

```typescript
import { PasswordResetManager, PasswordPolicyEnforcer } from "securenx";

const policyEnforcer = new PasswordPolicyEnforcer();
const resetManager = new PasswordResetManager(policyEnforcer);

// Generate a reset token
const userId = "user123";
const resetToken = resetManager.generateResetToken(userId);

// Send the reset token to the user (e.g., via email)
sendResetEmail(userId, resetToken);

// Later, when the user attempts to reset their password
async function resetPassword(token: string, newPassword: string) {
  const errors = await resetManager.resetPassword(token, newPassword);
  if (errors.length > 0) {
    console.log("Password reset failed:", errors);
  } else {
    console.log("Password reset successful");
  }
}

resetPassword("reset_token_here", "NewSecurePassword123!");
```

## API Reference

### `PasswordResetManager`

#### Constructor

```typescript
constructor(policyEnforcer?: PasswordPolicyEnforcer)
```

Creates a new `PasswordResetManager` instance with an optional `PasswordPolicyEnforcer`.

#### `generateResetToken(userId: string): string`

Generates a secure reset token for the given user ID.

#### `verifyResetToken(token: string): string | null`

Verifies a reset token and returns the associated user ID if valid, or null if invalid or expired.

#### `resetPassword(token: string, newPassword: string): Promise<string[]>`

Attempts to reset the password using the provided token and new password. Returns an array of error messages if the reset fails (e.g., due to policy violations).

#### `cleanupExpiredTokens(): void`

Removes expired tokens from the internal storage.

## Best Practices

1. Use a secure method (e.g., email) to send reset tokens to users.
2. Set a short expiration time for reset tokens (e.g., 1 hour).
3. Implement rate limiting on password reset attempts to prevent abuse.
4. Log all password reset attempts for security auditing.
5. Notify users when their password has been reset successfully.
6. Consider implementing multi-factor authentication for password resets on sensitive accounts.

[← Back to Auth Features Overview](./auth-features-overview.md)
