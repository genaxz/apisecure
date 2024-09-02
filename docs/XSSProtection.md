# XSS Protection

This package provides robust Cross-Site Scripting (XSS) Protection tools for your web applications. It helps sanitize user inputs, generate Content Security Policy (CSP) headers, and enhance overall security against XSS attacks.

## Table of Contents

1. [Installation](#installation)
2. [Features](#features)
3. [Server-Side Usage Examples](#server-side-usage-examples)
   - [Express.js](#expressjs)
   - [Nest.js](#nestjs)
   - [Koa.js](#koajs)
4. [Client-Side Usage Examples](#client-side-usage-examples)
   - [React](#react)
   - [Vue.js](#vuejs)
5. [Advanced Usage](#advanced-usage)
   - [Custom DOMPurify Configuration](#custom-dompurify-configuration)
   - [Generating CSP Nonce](#generating-csp-nonce)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Features

- Content sanitization using DOMPurify
- Content Security Policy (CSP) header generation
- CSP nonce generation for inline scripts
- Safe content type validation

## Server-Side Usage Examples

### Express.js

Basic usage with Express.js:

```javascript
const express = require("express");
const { XssProtector } = require("apisecure");

const app = express();
const xssProtector = new XssProtector();

// Middleware to add CSP headers
app.use((req, res, next) => {
  const cspOptions = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  };
  const cspHeader = xssProtector.generateCspHeader(cspOptions);
  res.setHeader("Content-Security-Policy", cspHeader);
  next();
});

// Route with input sanitization
app.post("/comment", (req, res) => {
  const { comment } = req.body;
  const sanitizedComment = xssProtector.sanitize(comment);
  // Save sanitizedComment to database
  res.json({ message: "Comment saved successfully" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Nest.js

Implementing XSS protection in a Nest.js application:

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { XssProtector } from 'apisecure';

@Injectable()
export class XssProtectionMiddleware implements NestMiddleware {
  private xssProtector: XssProtector;

  constructor() {
    this.xssProtector = new XssProtector();
  }

  use(req: Request, res: Response, next: NextFunction) {
    const cspOptions = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    };
    const cspHeader = this.xssProtector.generateCspHeader(cspOptions);
    res.setHeader('Content-Security-Policy', cspHeader);
    next();
  }
}

// In your controller
@Post('comment')
createComment(@Body() commentDto: CommentDto) {
  const sanitizedComment = this.xssProtector.sanitize(commentDto.content);
  // Save sanitizedComment to database
  return { message: 'Comment saved successfully' };
}
```

### Koa.js

Using XSS protection with Koa.js:

```javascript
const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const { XssProtector } = require("apisecure");

const app = new Koa();
const router = new Router();
const xssProtector = new XssProtector();

// Middleware to add CSP headers
app.use(async (ctx, next) => {
  const cspOptions = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  };
  const cspHeader = xssProtector.generateCspHeader(cspOptions);
  ctx.set("Content-Security-Policy", cspHeader);
  await next();
});

app.use(bodyParser());

router.post("/comment", (ctx) => {
  const { comment } = ctx.request.body;
  const sanitizedComment = xssProtector.sanitize(comment);
  // Save sanitizedComment to database
  ctx.body = { message: "Comment saved successfully" };
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(3000);
```

## Client-Side Usage Examples

While XSS protection is primarily a server-side concern, there are client-side practices that can complement your server-side defenses.

### React

Example of using sanitized content in React:

```jsx
import React from "react";
import DOMPurify from "dompurify";

const SanitizedContent = ({ html }) => {
  const sanitizedHtml = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};

// Usage
const App = () => {
  const userGeneratedContent =
    '<p>User comment with <script>alert("XSS")</script></p>';
  return <SanitizedContent html={userGeneratedContent} />;
};
```

### Vue.js

Example of a Vue.js component with XSS protection:

```vue
<template>
  <div v-html="sanitizedContent"></div>
</template>

<script>
import DOMPurify from 'dompurify';

export default {
  props: ['content'],
  computed: {
    sanitizedContent() {
      return DOMPurify.sanitize(this.content);
    }
  }
}
</script>

<!-- Usage -->
<template>
  <SanitizedContent :content="userGeneratedContent" />
</template>

<script>
export default {
  data() {
    return {
      userGeneratedContent: '<p>User comment with <script>alert("XSS")</script></p>'
    }
  }
}
</script>
```

## Advanced Usage

### Custom DOMPurify Configuration

You can customize the DOMPurify configuration:

```javascript
const xssProtector = new XssProtector({
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
  ALLOWED_ATTR: ["href", "title", "target"],
});

const sanitizedContent = xssProtector.sanitize(userInput, {}, "text/html");
```

### Generating CSP Nonce

For inline scripts, you can generate a nonce:

```javascript
const nonce = xssProtector.generateCspNonce();

const cspOptions = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", `'nonce-${nonce}'`],
};

const cspHeader = xssProtector.generateCspHeader(cspOptions);
res.setHeader("Content-Security-Policy", cspHeader);

// In your HTML
res.send(`
  <script nonce="${nonce}">
    // Your inline script here
  </script>
`);
```

## Best Practices

1. Always sanitize user-generated content before rendering or storing it.
2. Implement Content Security Policy headers to provide an additional layer of protection.
3. Use HTTPOnly and Secure flags for cookies to prevent XSS attacks from stealing session information.
4. Validate and sanitize input on both client and server sides.
5. Use template engines or frameworks that automatically escape output.
6. Regularly update your dependencies to get the latest security patches.
7. Implement proper error handling to avoid exposing sensitive information.
8. Use HTTPS to encrypt data in transit and prevent man-in-the-middle attacks.

## Troubleshooting

1. **Issue**: Content not rendering after sanitization
   **Solution**: Check your DOMPurify configuration to ensure you're not overly restricting allowed tags or attributes.

2. **Issue**: CSP blocking legitimate scripts or resources
   **Solution**: Review your CSP directives and ensure all necessary sources are included. Use the report-uri directive to monitor CSP violations.

3. **Issue**: Performance issues with large amounts of content
   **Solution**: Consider sanitizing content asynchronously or in batches for large datasets. You might also want to sanitize content before storing it in the database rather than on every render.

For more detailed information on our security package and other features, please refer to the [main documentation](../../README.md).
