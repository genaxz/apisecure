# Input Validation and Sanitization Package

This package provides robust input validation and sanitization tools for your web applications. It's designed to work seamlessly in both server-side and client-side environments, offering a flexible and secure way to handle user inputs.

## Features

- Email validation
- URL validation
- String sanitization with length limits
- Number sanitization with range constraints
- Boolean sanitization
- Alphanumeric validation
- Length validation
- Regular expression-based validation
- Customizable factory for creating validators and sanitizers
- Array sanitization

## Usage

### Server-Side (Node.js/Express)

#### Basic Validation

```typescript
import express from "express";
import { InputProcessorFactory, InputValidator } from "apisecure";

const app = express();
app.use(express.json());

app.post("/register", (req, res) => {
  const { email, password, username } = req.body;

  const emailValidator = InputProcessorFactory.createValidator("email");
  const passwordValidator = new LengthValidator(8, 50);
  const usernameValidator = new AlphanumericValidator();

  if (!emailValidator.validate(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  if (!passwordValidator.validate(password)) {
    return res
      .status(400)
      .json({ error: "Password must be between 8 and 50 characters" });
  }

  if (!usernameValidator.validate(username)) {
    return res.status(400).json({ error: "Username must be alphanumeric" });
  }

  // Process registration...
  res.json({ message: "Registration successful" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

#### Input Sanitization

```typescript
import { InputProcessorFactory, sanitizeArray } from "apisecure";

app.post("/createProfile", (req, res) => {
  const { name, age, interests } = req.body;

  const stringSanitizer = InputProcessorFactory.createSanitizer("string");
  const numberSanitizer = InputProcessorFactory.createSanitizer("number");

  const sanitizedName = stringSanitizer.sanitize(name);
  const sanitizedAge = numberSanitizer.sanitize(age);
  const sanitizedInterests = sanitizeArray(interests, stringSanitizer);

  // Process sanitized inputs...
  res.json({
    message: "Profile created",
    profile: {
      name: sanitizedName,
      age: sanitizedAge,
      interests: sanitizedInterests,
    },
  });
});
```

#### Custom Validation

```typescript
import { RegexValidator, InputValidator } from "apisecure";

const passwordValidator = new RegexValidator(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
);

app.post("/updatePassword", (req, res) => {
  const { password } = req.body;

  if (!passwordValidator.validate(password)) {
    return res.status(400).json({
      error:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long",
    });
  }

  // Update password...
  res.json({ message: "Password updated successfully" });
});
```

### Client-Side (Browser)

#### React Form Validation

```jsx
import React, { useState } from "react";
import { InputProcessorFactory, InputValidator } from "apisecure";

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [errors, setErrors] = useState({});

  const emailValidator = InputProcessorFactory.createValidator("email");
  const passwordValidator = new LengthValidator(8, 50);
  const usernameValidator = new AlphanumericValidator();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!emailValidator.validate(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!passwordValidator.validate(formData.password)) {
      newErrors.password = "Password must be between 8 and 50 characters";
    }

    if (!usernameValidator.validate(formData.username)) {
      newErrors.username = "Username must be alphanumeric";
    }

    if (Object.keys(newErrors).length === 0) {
      // Submit form...
      console.log("Form submitted:", formData);
    } else {
      setErrors(newErrors);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email}</span>}

      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
      />
      {errors.password && <span>{errors.password}</span>}

      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="Username"
      />
      {errors.username && <span>{errors.username}</span>}

      <button type="submit">Register</button>
    </form>
  );
};

export default RegistrationForm;
```

#### Vue.js Form Validation

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formData.email" type="email" placeholder="Email" />
    <span v-if="errors.email">{{ errors.email }}</span>

    <input v-model="formData.password" type="password" placeholder="Password" />
    <span v-if="errors.password">{{ errors.password }}</span>

    <input v-model="formData.username" type="text" placeholder="Username" />
    <span v-if="errors.username">{{ errors.username }}</span>

    <button type="submit">Register</button>
  </form>
</template>

<script>
import {
  InputProcessorFactory,
  LengthValidator,
  AlphanumericValidator,
} from "apisecure";

export default {
  data() {
    return {
      formData: { email: "", password: "", username: "" },
      errors: {},
    };
  },
  methods: {
    handleSubmit() {
      const emailValidator = InputProcessorFactory.createValidator("email");
      const passwordValidator = new LengthValidator(8, 50);
      const usernameValidator = new AlphanumericValidator();

      this.errors = {};

      if (!emailValidator.validate(this.formData.email)) {
        this.errors.email = "Invalid email address";
      }

      if (!passwordValidator.validate(this.formData.password)) {
        this.errors.password = "Password must be between 8 and 50 characters";
      }

      if (!usernameValidator.validate(this.formData.username)) {
        this.errors.username = "Username must be alphanumeric";
      }

      if (Object.keys(this.errors).length === 0) {
        // Submit form...
        console.log("Form submitted:", this.formData);
      }
    },
  },
};
</script>
```

### Advanced Use Cases

#### Custom Validator

```typescript
import { Validator } from "apisecure";

class CreditCardValidator implements Validator {
  validate(input: string): boolean {
    // Implement credit card validation logic
    // This is a simplified example and not for production use
    return /^\d{16}$/.test(input.replace(/\s/g, ""));
  }
}

const ccValidator = new CreditCardValidator();
console.log(ccValidator.validate("1234 5678 9012 3456")); // true
console.log(ccValidator.validate("1234 5678 9012 345")); // false
```

#### Chaining Validators

```typescript
import {
  InputValidator,
  LengthValidator,
  AlphanumericValidator,
} from "apisecure";

const usernameValidators = [
  new LengthValidator(3, 20),
  new AlphanumericValidator(),
];

function validateUsername(username: string): boolean {
  return InputValidator.validate(username, usernameValidators);
}

console.log(validateUsername("john123")); // true
console.log(validateUsername("jo")); // false (too short)
console.log(validateUsername("john_doe")); // false (not alphanumeric)
```

#### Array Sanitization

```typescript
import { InputProcessorFactory, sanitizeArray } from "apisecure";

const numberSanitizer = InputProcessorFactory.createSanitizer("number");
const rawNumbers = ["1", "2", "3", "four", "5"];

const sanitizedNumbers = sanitizeArray(rawNumbers, numberSanitizer);
console.log(sanitizedNumbers); // [1, 2, 3, 5]
```

## API Reference

### Validators

- `EmailValidator`
- `UrlValidator`
- `AlphanumericValidator`
- `LengthValidator`
- `RegexValidator`

### Sanitizers

- `StringSanitizer`
- `NumberSanitizer`
- `BooleanSanitizer`

### Utility Classes

- `InputProcessorFactory`
- `InputValidator`

### Utility Functions

- `sanitizeArray<T>(input: string[], sanitizer: Sanitizer<T>): T[]`
- `truncateInput(input: string, maxLength: number = 1000, suffix: string = "..."): string`

## Best Practices

1. Always validate and sanitize user inputs on the server-side, even if client-side validation is implemented.
2. Use appropriate validators for different types of data (e.g., email, URL, alphanumeric).
3. Implement length restrictions to prevent overly long inputs.
4. Use custom validators for domain-specific validation requirements.
5. Sanitize inputs before storing or processing them to prevent injection attacks.
6. Combine multiple validators when necessary to enforce stricter rules.
7. Use the `truncateInput` function to prevent DoS attacks via extremely long inputs.
