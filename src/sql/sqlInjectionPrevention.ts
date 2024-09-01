import { escape, escapeId } from "sqlstring";
import { SecurityLibraryError } from "../utils/customError";
import { globalLogger } from "../utils/logger";

export class SqlInjectionError extends SecurityLibraryError {
  constructor(message: string) {
    super(message, 400);
    this.name = "SqlInjectionError";
  }
}

interface SqlOperationConfig {
  select: string[];
  insert: string[];
  update: string[];
  delete: string[];
}

export class SqlInjectionPreventer {
  private allowedOperations: SqlOperationConfig;

  constructor(config?: Partial<SqlOperationConfig>) {
    const defaultConfig: SqlOperationConfig = {
      select: ["SELECT"],
      insert: ["INSERT"],
      update: ["UPDATE"],
      delete: ["DELETE"],
    };
    this.allowedOperations = { ...defaultConfig, ...config };
  }

  escapeValue(value: string | number | boolean | Date): string {
    return escape(value);
  }

  escapeIdentifier(identifier: string): string {
    return escapeId(identifier);
  }

  createParameterizedQuery(
    sql: string,
    params: (string | number | boolean | Date)[]
  ): { sql: string; values: (string | number | boolean | Date)[] } {
    const operation = sql.trim().split(" ")[0].toUpperCase();
    const operationType = operation.toLowerCase() as keyof SqlOperationConfig;

    if (!this.allowedOperations[operationType]?.includes(operation)) {
      const error = new SqlInjectionError(
        `Operation ${operation} is not allowed`
      );
      globalLogger.warn("Attempted disallowed SQL operation", {
        operation,
        sql,
      });
      throw error;
    }

    globalLogger.info("Created parameterized query", { operation });
    return {
      sql: sql.replace(/\?/g, () => "?"),
      values: params,
    };
  }

  sanitizeQuery(query: string): string {
    const tokens = this.tokenizeQuery(query);
    let inComment = false;
    const sanitized = tokens
      .map((token) => {
        if (token.type === "comment") {
          inComment = true;
          return token.value;
        }
        if (
          inComment &&
          token.type === "whitespace" &&
          token.value.includes("\n")
        ) {
          inComment = false;
        }
        if (inComment) {
          return token.value;
        }
        switch (token.type) {
          case "identifier":
            return this.escapeIdentifier(token.value);
          case "value":
            return token.value;
          case "whitespace":
            return token.value === "\n" ? "\n" : " ";
          default:
            return token.value;
        }
      })
      .join("");

    globalLogger.info("Sanitized SQL query");
    return sanitized.trim();
  }

  private tokenizeQuery(query: string): Array<{ type: string; value: string }> {
    const regex =
      /(\w+)|('[^']*')|("[^"]*")|(--.*(?:\n|$))|(\/\*[\s\S]*?\*\/)|(\s+)|./g;
    const tokens: Array<{ type: string; value: string }> = [];
    let match;
    while ((match = regex.exec(query)) !== null) {
      const value = match[0];
      if (this.isKeyword(value)) {
        tokens.push({ type: "keyword", value: value.toUpperCase() });
      } else if (this.isIdentifier(value)) {
        tokens.push({ type: "identifier", value });
      } else if (value.startsWith("'") || value.startsWith('"')) {
        tokens.push({ type: "value", value });
      } else if (value.startsWith("--") || value.startsWith("/*")) {
        tokens.push({ type: "comment", value });
      } else if (/\s+/.test(value)) {
        tokens.push({ type: "whitespace", value });
      } else {
        tokens.push({ type: "operator", value });
      }
    }
    return tokens;
  }

  private isKeyword(word: string): boolean {
    const keywords = [
      "SELECT",
      "FROM",
      "WHERE",
      "AND",
      "OR",
      "INSERT",
      "INTO",
      "VALUES",
      "UPDATE",
      "SET",
      "DELETE",
    ];
    return keywords.includes(word.toUpperCase());
  }

  private isIdentifier(word: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word);
  }
}
