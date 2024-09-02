# Password Policy

The `PasswordPolicyEnforcer` class provides a robust system for enforcing password strength and security policies.

## Features

- Customizable password requirements (length, character types, etc.)
- Check against common passwords using the "Have I Been Pwned" API
- Password strength scoring using zxcvbn

## Usage

```typescript
import { PasswordPolicyEnforcer } from "securestack";

const policyEnforcer = new PasswordPolicyEnforcer({
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxConsecutiveRepeats: 3,
  minStrengthScore: 3,
});

async function validatePassword(password: string) {
  const errors = await policyEnforcer.enforcePolicy(password);
  if (errors.length > 0) {
    console.log("Password does not meet policy requirements:", errors);
  } else {
    console.log("Password meets all policy requirements");
  }
}

validatePassword("Weak123!");
```

## API Reference

### `PasswordPolicyEnforcer`

#### Constructor

```typescript
constructor(config?: Partial<PasswordPolicyConfig>)
```

Creates a new `PasswordPolicyEnforcer` instance with optional custom configuration.

#### `enforcePolicy(password: string): Promise<string[]>`

Checks a password against the configured policy and returns an array of error messages for any policy violations.

### `isPasswordCommon(password: string): Promise<boolean>`

A utility function that checks if a password is common using the "Have I Been Pwned" API.

## Best Practices

1. Encourage users to use passphrases instead of complex, hard-to-remember passwords.
2. Balance security requirements with usability to prevent user frustration.
3. Educate users on the importance of strong, unique passwords.
4. Consider implementing a password manager integration or recommendation.
5. Regularly update your password policy based on current security best practices.

[← Back to Auth Features Overview](./AuthFeaturesOverview.md)
