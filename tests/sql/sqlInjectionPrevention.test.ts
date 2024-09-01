import { SqlInjectionPreventer } from "../../src/sql/sqlInjectionPrevention";

describe("SQL Injection Preventer", () => {
  let preventer: SqlInjectionPreventer;

  beforeEach(() => {
    preventer = new SqlInjectionPreventer();
  });

  test("escapes values correctly", () => {
    expect(preventer.escapeValue("It's a trap")).toBe("'It\\'s a trap'");
  });

  test("escapes identifiers correctly", () => {
    expect(preventer.escapeIdentifier("user_name")).toBe("`user_name`");
  });

  test("creates parameterized query", () => {
    const { sql, values } = preventer.createParameterizedQuery(
      "SELECT * FROM users WHERE id = ? AND name = ?",
      [1, "John"]
    );
    expect(sql).toBe("SELECT * FROM users WHERE id = ? AND name = ?");
    expect(values).toEqual([1, "John"]);
  });

  test("throws error for disallowed SQL operation", () => {
    expect(() =>
      preventer.createParameterizedQuery("DROP TABLE users", [])
    ).toThrow("Operation DROP is not allowed");
  });

  test("sanitizes simple query", () => {
    const sanitized = preventer.sanitizeQuery(
      "SELECT * FROM users WHERE name = 'John'"
    );
    expect(sanitized).toBe("SELECT * FROM `users` WHERE `name` = 'John'");
  });

  test("sanitizes complex query with multiple parts", () => {
    const sanitized = preventer.sanitizeQuery(
      "SELECT id, name FROM users WHERE age > 18 AND city = 'New York'"
    );
    expect(sanitized).toBe(
      "SELECT `id` , `name` FROM `users` WHERE `age` > 18 AND `city` = 'New York'"
    );
  });

  test("handles comments in query", () => {
    const sanitized = preventer.sanitizeQuery(
      "SELECT * FROM users -- Get all users\nWHERE active = 1"
    );
    expect(sanitized).toBe(
      "SELECT * FROM `users` -- Get all users\nWHERE `active` = 1"
    );
  });

  test("sanitizes query with potential SQL injection attempt", () => {
    const sanitized = preventer.sanitizeQuery(
      "SELECT * FROM users WHERE username = 'admin' --' AND password = 'anything'"
    );
    expect(sanitized).toBe(
      "SELECT * FROM `users` WHERE `username` = 'admin' --' AND password = 'anything'"
    );
  });
});
