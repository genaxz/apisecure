# Authentication Features: Comprehensive Examples

This guide provides practical examples of how to use our authentication package in both server-side and client-side projects. We'll cover each feature with real-world scenarios and code samples.

## Table of Contents

1. [Installation](#installation)
2. [Auth Helpers](#auth-helpers)
3. [Password Policy](#password-policy)
4. [Password Reset](#password-reset)
5. [Session Management](#session-management)
6. [Two-Factor Authentication](#two-factor-authentication)

## Auth Helpers

### Server-side (Express.js) Example

```javascript
const express = require("express");
const { AuthHelpers } = require("securenx");

const app = express();
const authHelpers = new AuthHelpers();

// User registration
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await authHelpers.hashPassword(password);
  // Save user to database with hashedPassword
  // ...
  res.json({ message: "User registered successfully" });
});

// User login
app.post(
  "/login",
  authHelpers.authenticate(async (username) => {
    // Fetch user from database
    // Return user object or null if not found
  }),
  (req, res) => {
    const token = authHelpers.generateToken(req.user);
    res.json({ token });
  }
);

// Protected route
app.get("/profile", authHelpers.authorize("user"), (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Client-side (React) Example

```jsx
import React, { useState } from "react";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/login", { username, password });
      localStorage.setItem("token", response.data.token);
      // Redirect to profile page or update app state
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
```

## Password Policy

### Server-side (Node.js) Example

```javascript
const { PasswordPolicyEnforcer } = require("securenx");

const policyEnforcer = new PasswordPolicyEnforcer({
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
});

async function validatePassword(password) {
  const errors = await policyEnforcer.enforcePolicy(password);
  return errors.length === 0;
}

// Usage in registration route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!(await validatePassword(password))) {
    return res
      .status(400)
      .json({ error: "Password does not meet policy requirements" });
  }

  // Continue with registration process
  // ...
});
```

### Client-side (Vue.js) Example

```vue
<template>
  <form @submit.prevent="register">
    <input v-model="username" placeholder="Username" />
    <input v-model="password" type="password" placeholder="Password" />
    <ul v-if="policyErrors.length">
      <li v-for="error in policyErrors" :key="error">{{ error }}</li>
    </ul>
    <button type="submit" :disabled="policyErrors.length > 0">Register</button>
  </form>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      username: "",
      password: "",
      policyErrors: [],
    };
  },
  watch: {
    password() {
      this.validatePassword();
    },
  },
  methods: {
    async validatePassword() {
      try {
        const response = await axios.post("/validate-password", {
          password: this.password,
        });
        this.policyErrors = response.data.errors || [];
      } catch (error) {
        console.error("Password validation failed:", error);
      }
    },
    async register() {
      // Implement registration logic
    },
  },
};
</script>
```

## Password Reset

### Server-side (Express.js) Example

```javascript
const express = require("express");
const { PasswordResetManager } = require("securenx");

const app = express();
const resetManager = new PasswordResetManager();

// Request password reset
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await findUserByEmail(email);
  if (user) {
    const resetToken = resetManager.generateResetToken(user.id);
    // Send reset token to user's email
    await sendResetEmail(email, resetToken);
  }
  res.json({ message: "If an account exists, a reset email has been sent." });
});

// Reset password
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const errors = await resetManager.resetPassword(token, newPassword);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  res.json({ message: "Password reset successfully" });
});
```

### Client-side (React) Example

```jsx
import React, { useState } from "react";
import axios from "axios";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/forgot-password", { email });
      setMessage("If an account exists, a reset email has been sent.");
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleForgotPassword}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit">Reset Password</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default PasswordReset;
```

## Session Management

### Server-side (Express.js) Example

```javascript
const express = require("express");
const { SessionManager } = require("securenx");

const app = express();
const sessionManager = new SessionManager();

app.use(sessionManager.middleware());

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // Verify credentials
  // ...
  const session = await sessionManager.createSession(user.id, {
    role: user.role,
  });
  res.cookie("sessionId", session.id, { httpOnly: true, secure: true });
  res.json({ message: "Logged in successfully" });
});

// Logout route
app.post("/logout", async (req, res) => {
  if (req.session) {
    await sessionManager.deleteSession(req.session.id);
    res.clearCookie("sessionId");
  }
  res.json({ message: "Logged out successfully" });
});

// Protected route
app.get("/dashboard", async (req, res) => {
  if (!req.session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ message: "Welcome to the dashboard", user: req.session.userId });
});
```

### Client-side (Vue.js) Example

```vue
<template>
  <div>
    <button v-if="!isLoggedIn" @click="login">Login</button>
    <button v-else @click="logout">Logout</button>
    <div v-if="isLoggedIn">
      <h2>Dashboard</h2>
      <!-- Dashboard content -->
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      isLoggedIn: false,
    };
  },
  methods: {
    async login() {
      try {
        await axios.post("/login", { username: "user", password: "pass" });
        this.isLoggedIn = true;
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
    async logout() {
      try {
        await axios.post("/logout");
        this.isLoggedIn = false;
      } catch (error) {
        console.error("Logout failed:", error);
      }
    },
  },
  mounted() {
    // Check session status on component mount
    axios
      .get("/dashboard")
      .then(() => (this.isLoggedIn = true))
      .catch(() => (this.isLoggedIn = false));
  },
};
</script>
```

## Two-Factor Authentication

### Server-side (Express.js) Example

```javascript
const express = require("express");
const { TwoFactorAuthManager } = require("securenx");

const app = express();
const twoFactorAuth = new TwoFactorAuthManager();

// Enable 2FA for a user
app.post("/enable-2fa", async (req, res) => {
  const userId = req.user.id; // Assume user is authenticated
  const secret = twoFactorAuth.generateSecret(userId);
  const qrCodeUrl = twoFactorAuth.getQRCodeUrl(userId, "YourAppName");
  res.json({
    secret: secret.secret,
    qrCodeUrl,
    backupCodes: secret.backupCodes,
  });
});

// Verify 2FA token during login
app.post("/verify-2fa", async (req, res) => {
  const { userId, token } = req.body;
  const isValid = twoFactorAuth.verifyToken(userId, token);
  if (isValid) {
    // Complete login process
    res.json({ message: "2FA verified successfully" });
  } else {
    res.status(401).json({ error: "Invalid 2FA token" });
  }
});
```

### Client-side (React) Example

```jsx
import React, { useState } from "react";
import axios from "axios";

const TwoFactorSetup = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [token, setToken] = useState("");

  const enable2FA = async () => {
    try {
      const response = await axios.post("/enable-2fa");
      setQrCodeUrl(response.data.qrCodeUrl);
      setBackupCodes(response.data.backupCodes);
    } catch (error) {
      console.error("Failed to enable 2FA:", error);
    }
  };

  const verify2FA = async () => {
    try {
      await axios.post("/verify-2fa", { token });
      alert("2FA verified successfully");
    } catch (error) {
      alert("Invalid 2FA token");
    }
  };

  return (
    <div>
      <button onClick={enable2FA}>Enable 2FA</button>
      {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" />}
      {backupCodes.length > 0 && (
        <div>
          <h3>Backup Codes:</h3>
          <ul>
            {backupCodes.map((code, index) => (
              <li key={index}>{code}</li>
            ))}
          </ul>
        </div>
      )}
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter 2FA token"
      />
      <button onClick={verify2FA}>Verify Token</button>
    </div>
  );
};

export default TwoFactorSetup;
```

These examples demonstrate how to integrate the various authentication features of your package into both server-side and client-side applications. They cover common scenarios such as user registration, login, password reset, session management, and two-factor authentication setup.

Remember to adapt these examples to your specific application architecture and requirements. Also, ensure that you're following best practices for security, such as using HTTPS, implementing proper error handling, and securing sensitive information.

[← Back to Main README](./AuthFeaturesOverview.md)
