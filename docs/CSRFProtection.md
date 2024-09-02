# CSRF Protection Package Usage

### Server-Side (Express.js)

#### Basic Setup

```typescript
import express from "express";
import { CsrfProtector } from "apisecure";

const app = express();
const csrfProtector = new CsrfProtector();

app.use(csrfProtector.middleware());

app.post("/api/data", (req, res) => {
  res.json({ message: "Data received successfully" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

#### Custom Configuration

```typescript
const csrfProtector = new CsrfProtector({
  tokenLength: 64,
  cookieName: "MY-CSRF-TOKEN",
  headerName: "X-MY-CSRF-TOKEN",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 7200000, // 2 hours
  },
});
```

#### Exclude Specific Routes

```typescript
app.post("/webhook", csrfProtector.exclude(), (req, res) => {
  // This route is excluded from CSRF protection
  res.json({ message: "Webhook received" });
});
```

#### Handle CSRF Errors

```typescript
app.use((err, req, res, next) => {
  if (err.name === "CsrfError") {
    res.status(403).json({ error: "CSRF validation failed" });
  } else {
    next(err);
  }
});
```

### Client-Side

#### React (with Axios)

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    axios.get("/csrf-token").then((response) => {
      setCsrfToken(response.data.csrfToken);
      axios.defaults.headers.common["X-XSRF-TOKEN"] = response.data.csrfToken;
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("/api/data", {
        /* your data */
      });
      console.log(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button type="submit">Submit</button>
    </form>
  );
};
```

#### Vue.js (with Axios)

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Your form fields -->
    <button type="submit">Submit</button>
  </form>
</template>

<script>
import axios from "axios";

export default {
  created() {
    axios.get("/csrf-token").then((response) => {
      axios.defaults.headers.common["X-XSRF-TOKEN"] = response.data.csrfToken;
    });
  },
  methods: {
    async handleSubmit() {
      try {
        const response = await axios.post("/api/data", {
          /* your data */
        });
        console.log(response.data);
      } catch (error) {
        console.error("Error:", error);
      }
    },
  },
};
</script>
```

#### Angular (with HttpClient)

```typescript
import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  selector: "app-root",
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Your form fields -->
      <button type="submit">Submit</button>
    </form>
  `,
})
export class AppComponent implements OnInit {
  private csrfToken: string = "";

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http
      .get("/csrf-token")
      .subscribe((response: any) => (this.csrfToken = response.csrfToken));
  }

  onSubmit() {
    const headers = new HttpHeaders().set("X-XSRF-TOKEN", this.csrfToken);
    this.http
      .post(
        "/api/data",
        {
          /* your data */
        },
        { headers }
      )
      .subscribe(
        (response) => console.log(response),
        (error) => console.error("Error:", error)
      );
  }
}
```

### Advanced Use Cases

#### Multi-page Applications

For multi-page applications, you may need to include the CSRF token in forms:

```html
<form action="/submit-data" method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>" />
  <!-- Other form fields -->
  <button type="submit">Submit</button>
</form>
```

#### WebSocket Connections

For WebSocket connections, you can include the CSRF token in the connection request:

```javascript
const socket = new WebSocket("ws://your-server.com/socket");
socket.onopen = () => {
  socket.send(JSON.stringify({ type: "csrf-token", token: csrfToken }));
};
```

#### File Uploads

For file uploads, include the CSRF token in the headers:

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

fetch("/upload", {
  method: "POST",
  body: formData,
  headers: {
    "X-XSRF-TOKEN": csrfToken,
  },
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

## API Reference

### `CsrfProtector`

The main class for CSRF protection.

#### Constructor

```typescript
new CsrfProtector(options?: Partial<CsrfOptions>)
```

#### Methods

- `middleware()`: Returns an Express middleware function for CSRF protection.
- `attachCsrfToken(req: Request, res: Response): string`: Manually attach a CSRF token to the response.
- `exclude()`: Returns middleware to exclude a route from CSRF protection.

## Best Practices

1. Always use HTTPS in production to prevent token interception.
2. Regenerate CSRF tokens after authentication to prevent session fixation attacks.
3. Use unique tokens per-session, at a minimum.
4. Consider token age and implement token expiration if necessary.
5. Include the CSRF token in all state-changing requests (POST, PUT, DELETE, etc.).
6. Implement proper error handling for CSRF validation failures.
7. Educate your team about CSRF risks and the importance of using the protection consistently.

## Troubleshooting

- **Token Mismatch Errors**: Ensure the token in the cookie matches the token in the header or form field.
- **Missing Token Errors**: Check if the CSRF middleware is applied correctly and the token is being generated.
- **Cross-Origin Issues**: Verify your CORS settings if you're making cross-origin requests.
