# Session Management

The `SessionManager` class provides a flexible session management system for web applications.

## Features

- In-memory session storage (easily extendable to other storage types)
- Session creation, retrieval, update, and deletion
- Automatic session cleanup
- Express.js middleware for easy integration
- Rate limiting for session creation

## Usage

```typescript
import express from "express";
import { SessionManager } from "securestack";

const app = express();
const sessionManager = new SessionManager();

// Use session middleware
app.use(sessionManager.middleware());

// Create a new session
app.post("/login", async (req, res) => {
  const userId = "user123"; // Get this from your authentication logic
  const session = await sessionManager.createSession(userId, { role: "user" });
  res.cookie("sessionId", session.id, { httpOnly: true, secure: true });
  res.json({ message: "Logged in successfully" });
});

// Use session data in a route
app.get("/profile", async (req, res) => {
  if (req.session) {
    res.json({ userId: req.session.userId, data: req.session.data });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Destroy a session (logout)
app.post("/logout", async (req, res) => {
  if (req.session) {
    await sessionManager.deleteSession(req.session.id);
    res.clearCookie("sessionId");
    res.json({ message: "Logged out successfully" });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

## API Reference

### `SessionManager`

#### Constructor

```typescript
constructor(store: SessionStore = new InMemorySessionStore())
```

Creates a new `SessionManager` instance with an optional custom session store.

#### `createSession(userId: string, data: { [key: string]: any } = {}): Promise<Session>`

Creates a new session for the given user ID with optional additional data.

#### `getSession(sessionId: string): Promise<Session | null>`

Retrieves a session by its ID.

#### `updateSession(sessionId: string, data: { [key: string]: any }): Promise<void>`

Updates the data associated with a session.

#### `deleteSession(sessionId: string): Promise<void>`

Deletes a session.

#### `refreshSession(sessionId: string): Promise<void>`

Refreshes a session, extending its expiration time.

#### `middleware()`

Returns an Express.js middleware function for session management.

## Best Practices

1. Use secure, HTTP-only cookies to store session IDs.
2. Implement CSRF protection alongside session management.
3. Regularly rotate session IDs to prevent session fixation attacks.
4. Set appropriate session timeout values based on your application's security requirements.
5. Consider using a distributed session store (e.g., Redis) for scalability in production environments.
6. Implement proper error handling and logging for session-related operations.
7. Use HTTPS to encrypt all session-related communication.

[← Back to Auth Features Overview](./AuthFeaturesOverview.md)
