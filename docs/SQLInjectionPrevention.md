# SQL Injection Prevention

This package provides robust SQL Injection Prevention tools for your web applications. It helps protect your database queries from malicious input and ensures safer interactions with your database.

## Table of Contents

1. [Installation](#installation)
2. [Features](#features)
3. [Server-Side Usage Examples](#server-side-usage-examples)
   - [Node.js with MySQL](#nodejs-with-mysql)
   - [Express.js with PostgreSQL](#expressjs-with-postgresql)
   - [Nest.js with TypeORM](#nestjs-with-typeorm)
4. [Client-Side Considerations](#client-side-considerations)
5. [Advanced Usage](#advanced-usage)
   - [Custom Configuration](#custom-configuration)
   - [Sanitizing Raw Queries](#sanitizing-raw-queries)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Features

- Parameterized query creation
- SQL query sanitization
- Escaping of values and identifiers
- Configurable allowed SQL operations
- Tokenization and analysis of SQL queries

## Server-Side Usage Examples

### Node.js with MySQL

Basic usage with Node.js and MySQL:

```javascript
const mysql = require("mysql");
const { SqlInjectionPreventer } = require("securenx");

const connection = mysql.createConnection({
  host: "localhost",
  user: "your_username",
  password: "your_password",
  database: "your_database",
});

const sqlPreventer = new SqlInjectionPreventer();

function getUserById(id) {
  const query = sqlPreventer.createParameterizedQuery(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );

  return new Promise((resolve, reject) => {
    connection.query(query.sql, query.values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

// Usage
getUserById(1)
  .then((user) => console.log(user))
  .catch((error) => console.error(error));
```

### Express.js with PostgreSQL

Implementing SQL injection prevention in an Express.js application with PostgreSQL:

```javascript
const express = require("express");
const { Pool } = require("pg");
const { SqlInjectionPreventer } = require("securenx");

const app = express();
app.use(express.json());

const pool = new Pool({
  user: "your_username",
  host: "localhost",
  database: "your_database",
  password: "your_password",
  port: 5432,
});

const sqlPreventer = new SqlInjectionPreventer();

app.post("/users", async (req, res) => {
  const { name, email } = req.body;

  try {
    const query = sqlPreventer.createParameterizedQuery(
      "INSERT INTO users(name, email) VALUES(?, ?) RETURNING id",
      [name, email]
    );

    const result = await pool.query(query.sql, query.values);
    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    if (error instanceof SqlInjectionError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Nest.js with TypeORM

Using SQL injection prevention in a Nest.js application with TypeORM:

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import { SqlInjectionPreventer } from "securenx";

@Injectable()
export class UserService {
  private sqlPreventer: SqlInjectionPreventer;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {
    this.sqlPreventer = new SqlInjectionPreventer();
  }

  async findByName(name: string): Promise<User[]> {
    const query = this.sqlPreventer.createParameterizedQuery(
      "SELECT * FROM users WHERE name LIKE ?",
      [`%${name}%`]
    );

    return this.userRepository.query(query.sql, query.values);
  }

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    const setClause = Object.keys(data)
      .map((key) => `${this.sqlPreventer.escapeIdentifier(key)} = ?`)
      .join(", ");

    const query = this.sqlPreventer.createParameterizedQuery(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...Object.values(data), id]
    );

    await this.userRepository.query(query.sql, query.values);
  }
}
```

## Client-Side Considerations

While SQL injection prevention is primarily a server-side concern, there are some client-side practices that can complement your server-side defenses:

1. Input Validation: Implement client-side input validation to catch obvious malformed inputs before they reach the server.

2. Sanitization: Sanitize user inputs on the client-side to remove potentially dangerous characters.

3. Error Handling: Implement proper error handling to prevent exposing sensitive information to the client.

Example of client-side input validation in React:

```jsx
import React, { useState } from "react";
import axios from "axios";

const UserSearch = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      setError("Name can only contain alphanumeric characters and spaces");
      return;
    }

    try {
      const response = await axios.get(
        `/api/users?name=${encodeURIComponent(name)}`
      );
      // Handle successful response
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError("Invalid input. Please try again.");
      } else {
        setError("An error occurred. Please try again later.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter user name"
      />
      <button type="submit">Search</button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

## Advanced Usage

### Custom Configuration

You can customize the allowed SQL operations:

```javascript
const customConfig = {
  select: ["SELECT"],
  insert: ["INSERT"],
  update: ["UPDATE"],
  delete: [], // Disallow DELETE operations
};

const sqlPreventer = new SqlInjectionPreventer(customConfig);
```

### Sanitizing Raw Queries

For cases where you need to work with raw SQL:

```javascript
const rawQuery = "SELECT * FROM users WHERE name = 'O''Brien'";
const sanitizedQuery = sqlPreventer.sanitizeQuery(rawQuery);
console.log(sanitizedQuery);
// Output: SELECT * FROM users WHERE name = 'O\'\'Brien'
```

## Best Practices

1. Always use parameterized queries or prepared statements.
2. Implement least privilege principle for database users.
3. Use ORM libraries when possible, as they often include built-in protections.
4. Regularly update your database and ORM libraries to get the latest security patches.
5. Implement proper error handling to avoid exposing sensitive information.
6. Use input validation on both client and server sides.
7. Implement proper logging for all database operations.
8. Regularly audit your code for potential SQL injection vulnerabilities.

## Troubleshooting

1. **Issue**: Queries fail after implementing SQL injection prevention
   **Solution**: Ensure that all dynamic parts of your queries are properly parameterized. Check for any hardcoded SQL in your application that might need updating.

2. **Issue**: Performance degradation with large queries
   **Solution**: For very large or complex queries, consider using batch operations or optimizing your database schema. Ensure indexes are properly set up.

3. **Issue**: Difficulty constructing complex queries
   **Solution**: For complex queries, consider using a query builder library in conjunction with this SQL injection prevention tool. This can help in constructing safe, complex queries programmatically.

For more detailed information on our security package and other features, please refer to the [main documentation](../../README.md).
