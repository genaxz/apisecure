# Auth Helpers

The `AuthHelpers` class provides essential methods for handling authentication and authorization in your application.

## Features

- Password hashing and verification
- JWT token generation and verification
- Authentication middleware
- Authorization middleware

## Usage

```typescript
import { AuthHelpers, User } from "apisecure";

const authHelpers = new AuthHelpers();

// Password hashing
const hashedPassword = await authHelpers.hashPassword("userPassword");

// Password verification
const isMatch = await authHelpers.verifyPassword(
  "userPassword",
  hashedPassword
);

// JWT token generation
const user: User = {
  id: "123",
  username: "john",
  password: "hashedPassword",
  role: "user",
};
const token = authHelpers.generateToken(user);

// JWT token verification
const payload = authHelpers.verifyToken(token);

// Authentication middleware
app.post(
  "/login",
  authHelpers.authenticate(async (username) => {
    // Implement your user lookup logic here
    return findUserByUsername(username);
  })
);

// Authorization middleware
app.get("/admin", authHelpers.authorize("admin"), (req, res) => {
  res.json({ message: "Welcome, admin!" });
});
```

## API Reference

### `hashPassword(password: string): Promise<string>`

Hashes a password using bcrypt.

### `verifyPassword(password: string, hash: string): Promise<boolean>`

Verifies a password against a bcrypt hash.

### `generateToken(user: User): string`

Generates a JWT token for a user.

### `verifyToken(token: string): JwtPayload | null`

Verifies a JWT token and returns the payload if valid.

### `authenticate(findUser: (username: string) => Promise<User | null>)`

Returns a middleware function for authenticating users.

### `authorize(...allowedRoles: string[])`

Returns a middleware function for authorizing users based on their roles.

## Best Practices

1. Always use HTTPS to protect tokens and passwords in transit.
2. Store hashed passwords, never plain text.
3. Use environment variables for sensitive information like JWT secrets.
4. Implement proper error handling and logging.
5. Regularly rotate JWT secrets in production environments.

[← Back to Auth Features Overview](./AuthFeaturesOverview.md)
