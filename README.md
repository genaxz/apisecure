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
or
yarn add securenx

## InputValidation Usage

- The input validation module provides tools for validating and sanitizing user inputs.

### Server-side Example (Node.js with Express)

```typescript
import express from "express";
import {
  InputProcessorFactory,
  InputValidator,
  truncateInput,
} from "your-package-name";

const app = express();
app.use(express.json());

app.post("/register", (req, res) => {
  const { email, password, username } = req.body;

  // Validate email
  const emailValidator = InputProcessorFactory.createValidator("email");
  if (!emailValidator.validate(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // Validate password length
  const passwordValidator = new LengthValidator(8, 50);
  if (!passwordValidator.validate(password)) {
    return res
      .status(400)
      .json({ error: "Password must be between 8 and 50 characters" });
  }

  // Sanitize username
  const usernameSanitizer = new StringSanitizer(20);
  const sanitizedUsername = usernameSanitizer.sanitize(username);

  // Prevent DoS attacks
  const truncatedPassword = truncateInput(password, 100);

  // Process registration...
  res.json({ message: "Registration successful", username: sanitizedUsername });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Client-side Example (React with TypeScript)

```tsx
import React, { useState } from "react";
import { InputProcessorFactory, InputValidator } from "your-package-name";

const ContactForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    // Validate email
    const emailValidator = InputProcessorFactory.createValidator("email");
    if (!emailValidator.validate(email)) {
      newErrors.push("Invalid email address");
    }

    // Validate message length
    const messageValidator = new LengthValidator(10, 500);
    if (!messageValidator.validate(message)) {
      newErrors.push("Message must be between 10 and 500 characters");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    } else {
      // Sanitize inputs before sending to server
      const emailSanitizer = InputProcessorFactory.createSanitizer("string");
      const messageSanitizer = new StringSanitizer(500);

      const sanitizedEmail = emailSanitizer.sanitize(email);
      const sanitizedMessage = messageSanitizer.sanitize(message);

      // Send sanitized data to server...
      console.log("Sending:", {
        email: sanitizedEmail,
        message: sanitizedMessage,
      });
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form JSX */}</form>;
};

export default ContactForm;
```

### License

- This project is licensed under the MIT License - see the LICENSE file for details.

- This README provides a comprehensive overview of the securenx library, including installation instructions and detailed usage examples for each feature. You may want to adjust some parts based on the exact implementation details or add more specific information about your project's structure and usage.
