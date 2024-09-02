# Secure Headers Examples

This guide provides comprehensive examples of how to use the Secure Headers feature in various server-side and client-side projects. Our Secure Headers module helps protect your web applications against common security vulnerabilities by setting appropriate HTTP headers.

## Table of Contents

1. [Installation](#installation)
2. [Server-Side Examples](#server-side-examples)
   - [Express.js](#expressjs)
   - [Koa.js](#koajs)
   - [Nest.js](#nestjs)
   - [Vanilla Node.js](#vanilla-nodejs)
3. [Client-Side Considerations](#client-side-considerations)
4. [Advanced Usage](#advanced-usage)
   - [Custom Headers](#custom-headers)
   - [Conditional Headers](#conditional-headers)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Server-Side Examples

### Express.js

Basic usage with Express.js:

```javascript
const express = require("express");
const { SecureHeaders } = require("securenx");

const app = express();

// Apply Secure Headers middleware
app.use((req, res, next) => {
  SecureHeaders.set(res);
  next();
});

app.get("/", (req, res) => {
  res.send("Hello, Secure World!");
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Koa.js

Implementing Secure Headers in a Koa.js application:

```javascript
const Koa = require("koa");
const { SecureHeaders } = require("securenx");

const app = new Koa();

app.use(async (ctx, next) => {
  SecureHeaders.set(ctx.res);
  await next();
});

app.use(async (ctx) => {
  ctx.body = "Hello, Secure Koa World!";
});

app.listen(3000);
```

### Nest.js

Using Secure Headers in a Nest.js application:

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SecureHeaders } from "securenx";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req, res, next) => {
    SecureHeaders.set(res);
    next();
  });

  await app.listen(3000);
}
bootstrap();
```

### Vanilla Node.js

Implementing Secure Headers in a vanilla Node.js server:

```javascript
const http = require("http");
const { SecureHeaders } = require("securenx");

const server = http.createServer((req, res) => {
  SecureHeaders.set(res);
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, Secure Vanilla Node World!");
});

server.listen(3000, () => console.log("Server running on port 3000"));
```

## Client-Side Considerations

While Secure Headers are primarily set on the server-side, they affect client-side behavior. Here are some considerations for client-side development:

### Content Security Policy (CSP)

If your CSP is strict, you may need to adjust your client-side code. For example:

```javascript
// Instead of inline scripts, use external files
<script src="app.js"></script>

// For styles, prefer external stylesheets
<link rel="stylesheet" href="styles.css">

// If you must use inline styles, you'll need to adjust your CSP
// In your server-side code:
res.setHeader(
  'Content-Security-Policy',
  "default-src 'self'; style-src 'self' 'unsafe-inline';"
);
```

### Dealing with Iframes

If your application uses iframes, you may need to adjust the `X-Frame-Options` header:

```javascript
// In your server-side code
res.setHeader("X-Frame-Options", "ALLOW-FROM https://trusted-site.com");
```

## Advanced Usage

### Custom Headers

Extending the SecureHeaders class to add custom headers:

```typescript
import { SecureHeaders } from "securenx";

class CustomSecureHeaders extends SecureHeaders {
  static set(res: any): void {
    super.set(res);
    res.setHeader("Custom-Security-Header", "SomeValue");
  }
}

// Usage
app.use((req, res, next) => {
  CustomSecureHeaders.set(res);
  next();
});
```

### Conditional Headers

Setting headers based on conditions:

```javascript
app.use((req, res, next) => {
  SecureHeaders.set(res);

  if (req.secure) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Content-Security-Policy", "default-src 'self';");
  } else {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-eval' 'unsafe-inline';"
    );
  }

  next();
});
```

## Best Practices

1. Always use HTTPS in production environments.
2. Regularly review and update your security headers.
3. Test your application thoroughly after implementing Secure Headers.
4. Use Content Security Policy reporting to monitor for potential issues.
5. Keep your Secure Headers package updated to get the latest security improvements.

## Troubleshooting

1. **Issue**: Content not loading after implementing CSP
   **Solution**: Gradually relax your CSP until you find the right balance. Use the CSP report-only header to test before enforcing.

2. **Issue**: Third-party scripts blocked
   **Solution**: Add the necessary domains to your CSP. For example:

   ```javascript
   res.setHeader(
     "Content-Security-Policy",
     "default-src 'self'; script-src 'self' https://trusted-cdn.com;"
   );
   ```

3. **Issue**: Inline styles or scripts not working
   **Solution**: Either move these to external files or use nonces/hashes in your CSP. For example:
   ```javascript
   const nonce = crypto.randomBytes(16).toString("base64");
   res.setHeader("Content-Security-Policy", `script-src 'nonce-${nonce}';`);
   // In your HTML:
   <script nonce="{{nonce}}">// Your inline script</script>;
   ```

For more detailed information on our security package and other features, please refer to the [main documentation](../../README.md).
