# securenx: A Comprehensive API Security Library

**securenx** is a robust TypeScript library designed to enhance the security of your Node.js and Express applications. It provides a suite of tools for:

- Input Validation
- SQL Injection Prevention
- XSS Protection
- CSRF Protection
- Authentication Helpers
- Password Policy Enforcement
- Password Reset Management
- Two-Factor Authentication
- Session Management
- Rate Limiting and Brute Force Protection

## Installation

To install securenx, use npm:

npm install securenx

# Input Validation

- The input validation module provides tools for validating and sanitizing user inputs.

```bash
import {
  EmailValidator,
  UrlValidator,
  StringSanitizer,
  NumberSanitizer,
  BooleanSanitizer,
  AlphanumericValidator,
  LengthValidator,
  RegexValidator,
  InputValidator
} from 'securenx';

// Email validation
const emailValidator = new EmailValidator();
console.log(emailValidator.isValid('example@example.com'));  // true or false

// URL validation
const urlValidator = new UrlValidator();
console.log(urlValidator.isValid('https://example.com'));  // true or false

// String sanitization
const stringSanitizer = new StringSanitizer();
console.log(stringSanitizer.sanitize('<script>alert("XSS")</script>'));  // sanitized output

// Number sanitization
const numberSanitizer = new NumberSanitizer();
console.log(numberSanitizer.sanitize('123abc'));  // sanitized number or error

// Boolean sanitization
const booleanSanitizer = new BooleanSanitizer();
console.log(booleanSanitizer.sanitize('true'));  // true or false

// Alphanumeric validation
const alphanumericValidator = new AlphanumericValidator();
console.log(alphanumericValidator.isValid('abc123'));  // true or false

// Length validation
const lengthValidator = new LengthValidator(5, 10);
console.log(lengthValidator.isValid('abcdefg'));  // true or false

// Regex validation
const regexValidator = new RegexValidator(/^[a-z]+$/);
console.log(regexValidator.isValid('abc'));  // true or false

#!/bin/bash

#
SQL Injection Prevention
Protect your database queries from SQL injection attacks

import { SqlInjectionPreventer } from 'securenx';

const sqlPreventer = new SqlInjectionPreventer();

// Escape values
console.log(sqlPreventer.escapeValue("It's a trap")); // 'It\'s a trap'

// Escape identifiers
console.log(sqlPreventer.escapeIdentifier('user_name')); // `user_name`

// Create parameterized queries
const { sql, values } = sqlPreventer.createParameterizedQuery(
  'SELECT * FROM users WHERE id = ? AND name = ?',
  [1, 'John']
);
console.log(sql); // 'SELECT * FROM users WHERE id = ? AND name = ?'
console.log(values); // [1, 'John']

// Sanitize entire queries
const sanitizedQuery = sqlPreventer.sanitizeQuery("SELECT * FROM users WHERE name = 'John'; DROP TABLE users;");
console.log(sanitizedQuery);
// Output: SELECT * FROM `users` WHERE `name` = 'John; DROP TABLE users;'

XSS Protection
Prevent Cross-Site Scripting (XSS) attacks in your application.

import { XssProtector } from 'securenx';

const xssProtector = new XssProtector();

// Sanitize HTML content
const unsafeHtml = '<script>alert("XSS")</script><p>Hello, world!</p>';
const safeHtml = xssProtector.sanitize(unsafeHtml);
console.log(safeHtml); // <p>Hello, world!</p>

// Generate CSP header
const cspHeader = xssProtector.generateCspHeader({
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://trusted-cdn.com'],
  styleSrc: ["'self'", 'https://trusted-cdn.com'],
});
console.log(cspHeader);
// Output: "Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; style-src 'self' https://trusted-cdn.com"

CSRF Protection
Implement Cross-Site Request Forgery (CSRF) protection in your Express application.

import express from 'express';
import { CsrfProtector } from 'securenx';

const app = express();
const csrfProtector = new CsrfProtector();

// Use CSRF protection middleware
app.use(csrfProtector.middleware());

app.get('/form', (req, res) => {
  // Attach CSRF token to the response
  const csrfToken = csrfProtector.attachCsrfToken(req, res);
  res.send(`
    <form method="POST" action="/submit">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <input type="submit" value="Submit">
    </form>
  `);
});

app.post('/submit', (req, res) => {
  // The CSRF middleware will validate the token
  res.send('Form submitted successfully!');
});

Authentication Helpers
Implement secure authentication in your application.

import { AuthHelpers } from 'securenx';

const authHelpers = new AuthHelpers();

// Hash a password
const hashedPassword = await authHelpers.hashPassword('securePassword123');

// Verify a password
const isPasswordValid = await authHelpers.verifyPassword('securePassword123', hashedPassword);

// Generate a JWT token
const user = { id: '123', username: 'john_doe', role: 'user' };
const token = authHelpers.generateToken(user);

// Verify a JWT token
const payload = authHelpers.verifyToken(token);

// Use authentication middleware
app.post('/login', authHelpers.authenticate(async (username) => {
  // Implement your user lookup logic here
  return await findUserByUsername(username);
}));

// Use authorization middleware
app.get('/admin', authHelpers.authorize('admin'), (req, res) => {
  res.send('Welcome, admin!');
});

Password Policy Enforcement
Enforce strong password policies in your application.

import { PasswordPolicyEnforcer } from 'securenx';

const policyEnforcer = new PasswordPolicyEnforcer();

const password = 'WeakPwd1';
const errors = policyEnforcer.enforcePolicy(password);

if (errors.length > 0) {
  console.log('Password policy violations:', errors);
} else {
  console.log('Password meets the policy requirements');
}

Password Reset Management
Implement secure password reset functionality.

import { PasswordResetManager } from 'securenx';

const resetManager = new PasswordResetManager();

// Generate a reset token
const token = resetManager.generateResetToken('user123');

// Verify a reset token
const userId = resetManager.verifyResetToken(token);

// Reset password
const errors = resetManager.resetPassword(token, 'NewSecurePassword123!');

if (errors.length > 0) {
  console.log('Password reset failed:', errors);
} else {
  console.log('Password reset successful');
}

// Clean up expired tokens
resetManager.cleanupExpiredTokens();

Two-Factor Authentication
Implement two-factor authentication (2FA) in your application.

import { TwoFactorAuthManager } from 'securenx';

const twoFAManager = new TwoFactorAuthManager();

// Generate a secret for a user
const secret = twoFAManager.generateSecret('user123');

// Verify a token
const isValid = twoFAManager.verifyToken('user123', '123456');

// Use a backup code
const isBackupCodeValid = twoFAManager.useBackupCode('user123', 'BACKUP123');

// Get QR code URL for authenticator apps
const qrCodeUrl = twoFAManager.getQRCodeUrl('user123', 'MyApp');

Session Management
Implement secure session management in your Express application.

import { SessionManager, InMemorySessionStore } from 'securenx';

const sessionStore = new InMemorySessionStore();
const sessionManager = new SessionManager(sessionStore);

// Use session middleware
app.use(sessionManager.middleware());

// Create a session
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  if (user) {
    const session = await sessionManager.createSession(user.id, { role: user.role });
    res.json({ sessionId: session.id });
  } else {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Use session data
app.get('/profile', async (req, res) => {
  if (req.session) {
    const userData = await fetchUserData(req.session.userId);
    res.json(userData);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Destroy a session (logout)
app.post('/logout', async (req, res) => {
  if (req.session) {
    await sessionManager.deleteSession(req.session.id);
    res.json({ message: 'Logged out successfully' });
  } else {
    res.status(400).json({ error: 'No active session' });
  }
});

Rate Limiting and Brute Force Protection
Implement rate limiting and protect against brute force attacks.

import { RateLimiter, BruteForceProtection } from 'securenx';

const rateLimiter = new RateLimiter([
  { windowMs: 15 * 60 * 1000, maxRequests: 100 } // 100 requests per 15 minutes
]);

const bruteForceProtection = new BruteForceProtection(5, 15 * 60 * 1000); // 5 attempts, 15 minutes lockout

// Use rate limiting middleware
app.use(rateLimiter.middleware());

// Use brute force protection in login route
app.post('/login', bruteForceProtection.middleware(), (req, res) => {
  // Your login logic here
});

// Record failed login attempts
app.post('/login', (req, res) => {
  if (loginFailed) {
    bruteForceProtection.recordFailedAttempt(req.ip);
  }
});

// Reset attempts on successful login
app.post('/login', (req, res) => {
  if (loginSuccessful) {
    bruteForceProtection.resetAttempts(req.ip);
  }
});

License
This project is licensed under the MIT License - see the LICENSE file for details.

This README provides a comprehensive overview of the securenx library, including installation instructions and detailed usage examples for each feature. You may want to adjust some parts based on the exact implementation details or add more specific information about your project's structure and usage.
```
