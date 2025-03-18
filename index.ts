#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as mysql2 from "mysql2/promise";

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  column_name: string;
  data_type: string;
}

const config = {
  server: {
    name: "example-servers/mysql",
    version: "0.1.0",
  },
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASS || "",
    database: process.env.MYSQL_DB || "",
    connectionLimit: 10,
    authPlugins: {
      mysql_clear_password: () => () => Buffer.from(process.env.MYSQL_PASS || "")
    }
  },
  paths: {
    schema: "schema",
  },
};

const pool = mysql2.createPool(config.mysql);
const server = new Server(config.server, {
  capabilities: {
    resources: {},
    tools: {},
  },
});

async function executeQuery<T>(sql: string, params: any[] = []): Promise<T> {
  const connection = await pool.getConnection();
  try {
    const result = await connection.query(sql, params);
    return (Array.isArray(result) ? result[0] : result) as T;
  } finally {
    connection.release();
  }
}

async function executeReadOnlyQuery<T>(sql: string): Promise<T> {
  const connection = await pool.getConnection();

  try {
    // Set read-only mode
    await connection.query("SET SESSION TRANSACTION READ ONLY");

    // Begin transaction
    await connection.beginTransaction();

    try {
      // Execute query
      const result = await connection.query(sql);
      const rows = Array.isArray(result) ? result[0] : result;

      // Rollback transaction (since it's read-only)
      await connection.rollback();

      // Reset to read-write mode
      await connection.query("SET SESSION TRANSACTION READ WRITE");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(rows, null, 2),
          },
        ],
        isError: false,
      } as T;
    } catch (error) {
      // Rollback transaction on query error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    // Ensure we rollback and reset transaction mode on any error
    try {
      await connection.rollback();
      await connection.query("SET SESSION TRANSACTION READ WRITE");
    } catch {
      // Ignore errors during cleanup
    }
    throw error;
  } finally {
    connection.release();
  }
}

// Add exports for the query functions
export { executeQuery, executeReadOnlyQuery };

// Request handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const results = (await executeQuery(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
  )) as TableRow[];

  return {
    resources: results.map((row: TableRow) => ({
      uri: new URL(
        `${row.table_name}/${config.paths.schema}`,
        `${config.mysql.host}:${config.mysql.port}`,
      ).href,
      mimeType: "application/json",
      name: `"${row.table_name}" database schema`,
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resourceUrl = new URL(request.params.uri);
  const pathComponents = resourceUrl.pathname.split("/");
  const schema = pathComponents.pop();
  const tableName = pathComponents.pop();

  if (schema !== config.paths.schema) {
    throw new Error("Invalid resource URI");
  }

  const results = (await executeQuery(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?",
    [tableName],
  )) as ColumnRow[];

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(results, null, 2),
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "mysql_query",
      description: "Run a read-only MySQL query",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "mysql_query") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const sql = request.params.arguments?.sql as string;
  return executeReadOnlyQuery(sql);
});

// Server startup and shutdown
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down...`);
  try {
    await pool.end();
  } catch (err) {
    console.error("Error closing pool:", err);
    throw err;
  }
};

process.on("SIGINT", async () => {
  try {
    await shutdown("SIGINT");
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  try {
    await shutdown("SIGTERM");
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

runServer().catch((error: unknown) => {
  console.error("Server error:", error);
  process.exit(1);
});
