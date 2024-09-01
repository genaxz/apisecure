# API Security Library

...

## Input Validation

Our input validation module provides robust tools for validating and sanitizing user inputs. It includes:

- Various validators (Email, URL, Alphanumeric, Length, Regex)
- Sanitizers for strings, numbers, and booleans
- Configurable length limits to prevent DoS attacks

### DoS Prevention

To prevent potential Denial of Service (DoS) attacks through large inputs, always use appropriate length limits:

1. Use the `LengthValidator` to validate input length.
2. Set a `maxLength` when using `StringSanitizer`.
3. Use the `truncateInput` utility function to limit input size before processing:

```typescript
import {
  truncateInput,
  StringSanitizer,
  LengthValidator,
} from "api-security-lib";

const input = truncateInput(userInput, 1000); // Limit to 1000 characters
const sanitizer = new StringSanitizer(1000);
const lengthValidator = new LengthValidator(1, 1000);

if (lengthValidator.validate(input)) {
  const sanitizedInput = sanitizer.sanitize(input);
  // Process sanitizedInput
} else {
  // Handle invalid input length
}
```

Always consider the appropriate length limits for your specific use case to balance between functionality and security.

...
