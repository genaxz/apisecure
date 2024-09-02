# Rate Limiter and Brute Force Protection

This package provides robust Rate Limiting and Brute Force Protection features for your web applications. These tools help protect your servers from abuse, DoS attacks, and unauthorized access attempts.

## Table of Contents

1. [Installation](#installation)
2. [Features](#features)
3. [Usage Examples](#usage-examples)
   - [Express.js](#expressjs)
   - [Nest.js](#nestjs)
   - [Koa.js](#koajs)
   - [Fastify](#fastify)
4. [Advanced Usage](#advanced-usage)
   - [Custom Rate Limit Rules](#custom-rate-limit-rules)
   - [Resetting Rate Limits](#resetting-rate-limits)
   - [Brute Force Protection for Login](#brute-force-protection-for-login)
5. [Client-Side Considerations](#client-side-considerations)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Features

- Flexible rate limiting with multiple rules
- In-memory storage with automatic cleanup
- Brute force protection for sensitive operations
- Easy integration with popular Node.js frameworks
- Customizable client identification

## Usage Examples

### Express.js

Basic usage with Express.js:

```javascript
const express = require("express");
const { RateLimiter, BruteForceProtection } = require("apisecure");

const app = express();

// Create instances
const rateLimiter = new RateLimiter();
const bruteForceProtection = new BruteForceProtection();

// Apply rate limiting to all routes
app.use(rateLimiter.middleware());

// Apply brute force protection to login route
app.post("/login", bruteForceProtection.middleware(), (req, res) => {
  // Login logic here
  if (loginFailed) {
    bruteForceProtection.recordFailedAttempt(req.ip);
    res.status(401).json({ error: "Login failed" });
  } else {
    bruteForceProtection.resetAttempts(req.ip);
    res.json({ message: "Login successful" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Nest.js

Implementing rate limiting and brute force protection in a Nest.js application:

```typescript
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { RateLimiter, BruteForceProtection } from "apisecure";

@Module({
  // ... other module configuration
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const rateLimiter = new RateLimiter();
    const bruteForceProtection = new BruteForceProtection();

    consumer.apply(rateLimiter.middleware()).forRoutes("*");

    consumer.apply(bruteForceProtection.middleware()).forRoutes("auth/login");
  }
}

// In your auth service
@Injectable()
export class AuthService {
  constructor(private bruteForceProtection: BruteForceProtection) {}

  async login(username: string, password: string, ip: string) {
    if (await this.validateUser(username, password)) {
      this.bruteForceProtection.resetAttempts(ip);
      return { success: true };
    } else {
      this.bruteForceProtection.recordFailedAttempt(ip);
      throw new UnauthorizedException("Login failed");
    }
  }
}
```

### Koa.js

Using rate limiting and brute force protection with Koa.js:

```javascript
const Koa = require("koa");
const Router = require("koa-router");
const { RateLimiter, BruteForceProtection } = require("apisecure");

const app = new Koa();
const router = new Router();

const rateLimiter = new RateLimiter();
const bruteForceProtection = new BruteForceProtection();

// Apply rate limiting to all routes
app.use(async (ctx, next) => {
  await new Promise((resolve) =>
    rateLimiter.middleware()(ctx.req, ctx.res, resolve)
  );
  await next();
});

// Apply brute force protection to login route
router.post("/login", async (ctx, next) => {
  await new Promise((resolve) =>
    bruteForceProtection.middleware()(ctx.req, ctx.res, resolve)
  );

  // Login logic here
  if (loginFailed) {
    bruteForceProtection.recordFailedAttempt(ctx.ip);
    ctx.status = 401;
    ctx.body = { error: "Login failed" };
  } else {
    bruteForceProtection.resetAttempts(ctx.ip);
    ctx.body = { message: "Login successful" };
  }
});

app.use(router.routes());
app.listen(3000);
```

### Fastify

Implementing rate limiting and brute force protection in a Fastify application:

```javascript
const fastify = require("fastify")();
const { RateLimiter, BruteForceProtection } = require("apisecure");

const rateLimiter = new RateLimiter();
const bruteForceProtection = new BruteForceProtection();

// Apply rate limiting to all routes
fastify.addHook("onRequest", (request, reply, done) => {
  rateLimiter.middleware()(request.raw, reply.raw, done);
});

// Apply brute force protection to login route
fastify.post("/login", {
  preHandler: (request, reply, done) => {
    bruteForceProtection.middleware()(request.raw, reply.raw, done);
  },
  handler: async (request, reply) => {
    // Login logic here
    if (loginFailed) {
      bruteForceProtection.recordFailedAttempt(request.ip);
      reply.code(401).send({ error: "Login failed" });
    } else {
      bruteForceProtection.resetAttempts(request.ip);
      reply.send({ message: "Login successful" });
    }
  },
});

fastify.listen(3000, (err) => {
  if (err) throw err;
  console.log("Server running on port 3000");
});
```

## Advanced Usage

### Custom Rate Limit Rules

You can create a rate limiter with custom rules:

```javascript
const customRules = [
  { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  { windowMs: 60 * 60 * 1000, maxRequests: 1000 }, // 1000 requests per hour
];

const rateLimiter = new RateLimiter(customRules);
```

### Resetting Rate Limits

You can manually reset rate limits for a specific client:

```javascript
const clientId = req.ip;
rateLimiter.reset(clientId);
```

### Brute Force Protection for Login

Implement brute force protection for a login system:

```javascript
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const clientId = req.ip;

  if (!bruteForceProtection.isAllowed(clientId)) {
    return res
      .status(403)
      .json({ error: "Too many failed attempts. Try again later." });
  }

  if (authenticateUser(username, password)) {
    bruteForceProtection.resetAttempts(clientId);
    res.json({ message: "Login successful" });
  } else {
    bruteForceProtection.recordFailedAttempt(clientId);
    res.status(401).json({ error: "Invalid credentials" });
  }
});
```

## Client-Side Considerations

While rate limiting and brute force protection are server-side features, you should consider the following for your client-side applications:

1. Implement proper error handling for 429 (Too Many Requests) responses.
2. Consider adding a delay or disabling the submit button after failed login attempts.
3. Provide clear feedback to users when they've been rate-limited or temporarily locked out.

Example React component handling rate limiting:

```jsx
import React, { useState } from "react";
import axios from "axios";

const LoginForm = () => {
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/login", { username, password });
      // Handle successful login
    } catch (error) {
      if (error.response && error.response.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else if (error.response && error.response.status === 403) {
        setError("Account temporarily locked. Please try again later.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
};
```

## Best Practices

1. Use HTTPS to prevent IP spoofing and maintain the integrity of client identification.
2. Implement logging for rate limit violations and brute force attempts to monitor for potential attacks.
3. Consider using a distributed cache (e.g., Redis) for rate limiting in a clustered environment.
4. Regularly review and adjust your rate limit rules based on your application's needs and traffic patterns.
5. Implement IP allow-listing for trusted clients that may require higher rate limits.
6. Use rate limiting in combination with other security measures like input validation and CSRF protection.

## Troubleshooting

1. **Issue**: Legitimate users getting rate limited
   **Solution**: Review and adjust your rate limit rules. Consider implementing IP allow-listing for trusted users.

2. **Issue**: Rate limiting not working in a load-balanced environment
   **Solution**: Use a distributed cache like Redis to share rate limit data across multiple servers.

3. **Issue**: Brute force protection locking out legitimate users
   **Solution**: Adjust the `maxAttempts` and `lockoutDuration` parameters. Consider implementing a progressive delay between login attempts.

For more detailed information on our security package and other features, please refer to the [main documentation](../../README.md).
