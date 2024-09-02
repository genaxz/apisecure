# securestack is a Comprehensive Authentication Package

A robust and flexible authentication solution for Node.js applications, providing a suite of security features to protect your web applications.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Documentation](#documentation)
5. [Examples](#examples)
6. [Contributing](#contributing)
7. [License](#license)

## Features

- **Auth Helpers**: Password hashing, JWT token generation and verification, authentication and authorization middleware.
- **Password Policy**: Customizable password strength enforcement, including length, character types, and common password checks.
- **Password Reset**: Secure token generation and verification for password reset functionality.
- **Session Management**: Flexible session handling with support for various storage backends.
- **Two-Factor Authentication**: TOTP-based two-factor authentication with QR code generation and backup codes.
- **XSS Protection**: Content sanitization and CSP header generation to prevent cross-site scripting attacks.
- **SQL Injection Prevention**: Tools for creating parameterized queries and sanitizing user inputs.
- **Rate Limiting**: Configurable rate limiting to prevent abuse and brute-force attacks.
- **Secure Headers**: Easy setup for security-related HTTP headers.

## Installation

```bash
npm install securestack
```

## Quick Start

Here's a basic example of how to use some of the core features:

```javascript
const express = require("express");
const { AuthHelpers, SessionManager, XssProtector } = require("securestack");

const app = express();
const authHelpers = new AuthHelpers();
const sessionManager = new SessionManager();
const xssProtector = new XssProtector();

app.use(express.json());
app.use(sessionManager.middleware());

// XSS protection middleware
app.use((req, res, next) => {
  const cspHeader = xssProtector.generateCspHeader({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  });
  res.setHeader("Content-Security-Policy", cspHeader);
  next();
});

// User registration
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await authHelpers.hashPassword(password);
  // Save user to database
  res.json({ message: "User registered successfully" });
});

// User login
app.post(
  "/login",
  authHelpers.authenticate(async (username) => {
    // Fetch user from database
    // Return user object or null if not found
  }),
  async (req, res) => {
    const session = await sessionManager.createSession(req.user.id, {
      role: req.user.role,
    });
    res.json({ message: "Logged in successfully", sessionId: session.id });
  }
);

// Protected route
app.get("/profile", authHelpers.authorize("user"), (req, res) => {
  res.json({ user: req.session.userId, role: req.session.data.role });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

## Documentation

For detailed information on each feature, please refer to the following documentation:

- [Auth Features Overview](./docs/Auth/AuthFeaturesOverview.md)
  - [Examples](./docs/Auth/AuthExamplesByFramework.md)
  - [Auth Helpers](./docs/Auth/AuthHelpers.md)
  - [Password Policy](./docs/Auth/PasswordPolicy.md)
  - [Password Reset](./docs/Auth/PasswordReset.md)
  - [Session Management](./docs/Auth/SessionManagement.md)
  - [Two-Factor Authentication](./docs/Auth/TwoFactorAuthentication.md)
- [XSS Protection](./docs/XSSProtection.md)
- [SQL Injection Prevention](./docs/SQLInjectionPrevention.md)
- [Rate Limiting](./docs/RateLimiter.md)
- [Secure Headers](./docs/SecureHeaders.md)
- [Input Validation](./docs/InputValidation.md)
- [CSRF Protection](./docs/CSRFProtection.md)

## Examples

For comprehensive examples of how to use this package in both server-side and client-side projects, check out our [Examples Guide](./docs).

## Contributing

We welcome contributions soon! Stay tuned for details on how to submit pull requests, report issues, and suggest improvements.

## License

This project is licensed under the MIT License. [LICENSE](./LICENSE)

## Disclaimer

This software is provided "as is," and does not guarantee complete protection against all security threats. Users should implement additional security measures and keep their systems updated, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository and we will review and fix accordingly.

---
