# MCP Server for MySQL based on NodeJS
[![smithery badge](https://smithery.ai/badge/@benborla29/mcp-server-mysql)](https://smithery.ai/server/@benborla29/mcp-server-mysql)

![Demo](assets/demo.gif)

A Model Context Protocol server that provides read-only access to MySQL databases. This server enables LLMs to inspect database schemas and execute read-only queries.

## Installation

### Using Smithery
The easiest way to install and configure this MCP server is through [Smithery](https://smithery.ai/server/@benborla29/mcp-server-mysql):

```bash
# Install the MCP server
npx -y @smithery/cli@latest install @benborla29/mcp-server-mysql --client claude
```

During configuration, you'll be prompted to enter your MySQL connection details. Smithery will automatically:
- Set up the correct environment variables
- Configure your LLM application to use the MCP server
- Test the connection to your MySQL database
- Provide helpful troubleshooting if needed

### Using MCP Get
You can also install this package using [MCP Get](https://mcp-get.com/packages/%40benborla29%2Fmcp-server-mysql):

```bash
npx @michaellatman/mcp-get@latest install @benborla29/mcp-server-mysql
```

MCP Get provides a centralized registry of MCP servers and simplifies the installation process.

### Using NPM/PNPM
For manual installation:

```bash
# Using npm
npm install -g @benborla29/mcp-server-mysql

# Using pnpm
pnpm add -g @benborla29/mcp-server-mysql
```

After manual installation, you'll need to configure your LLM application to use the MCP server (see Configuration section below).

## Components

### Tools

- **mysql_query**
  - Execute read-only SQL queries against the connected database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction
  - Supports prepared statements for secure parameter handling
  - Configurable query timeouts and result pagination
  - Built-in query execution statistics

### Resources

The server provides comprehensive database information:

- **Table Schemas**
  - JSON schema information for each table
  - Column names and data types
  - Index information and constraints
  - Foreign key relationships
  - Table statistics and metrics
  - Automatically discovered from database metadata

### Security Features

- SQL injection prevention through prepared statements
- Query whitelisting/blacklisting capabilities
- Rate limiting for query execution
- Query complexity analysis
- Configurable connection encryption
- Read-only transaction enforcement

### Performance Optimizations

- Optimized connection pooling
- Query result caching
- Large result set streaming
- Query execution plan analysis
- Configurable query timeouts

### Monitoring and Debugging

- Comprehensive query logging
- Performance metrics collection
- Error tracking and reporting
- Health check endpoints
- Query execution statistics

## Configuration

### Automatic Configuration with Smithery
If you installed using Smithery, your configuration is already set up. You can view or modify it with:

```bash
smithery configure @benborla29/mcp-server-mysql
```

### Manual Configuration for Claude Desktop App
To manually configure the MCP server for Claude Desktop App, add the following to your `claude_desktop_config.json` file (typically located in your user directory):

```json
{
  "mcpServers": {
    "mcp_server_mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@benborla29/mcp-server-mysql"
      ],
      "env": {
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASS": "",
        "MYSQL_DB": "db_name"
      }
    }
  }
}
```

Replace `db_name` with your database name or leave it blank to access all databases.

### Advanced Configuration Options
For more control over the MCP server's behavior, you can use these advanced configuration options:

```json
{
  "mcpServers": {
    "mcp_server_mysql": {
      "command": "/path/to/npx/binary/npx",
      "args": [
        "-y",
        "@benborla29/mcp-server-mysql"
      ],
      "env": {
        // Basic connection settings
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASS": "",
        "MYSQL_DB": "db_name",
        "PATH": "/path/to/node/bin:/usr/bin:/bin",
        
        // Performance settings
        "MYSQL_POOL_SIZE": "10",
        "MYSQL_QUERY_TIMEOUT": "30000",
        "MYSQL_CACHE_TTL": "60000",
        
        // Security settings
        "MYSQL_RATE_LIMIT": "100",
        "MYSQL_MAX_QUERY_COMPLEXITY": "1000",
        "MYSQL_SSL": "true",
        
        // Monitoring settings
        "MYSQL_ENABLE_LOGGING": "true",
        "MYSQL_LOG_LEVEL": "info",
        "MYSQL_METRICS_ENABLED": "true"
      }
    }
  }
}
```

## Environment Variables

### Basic Connection
- `MYSQL_HOST`: MySQL server host (default: "127.0.0.1")
- `MYSQL_PORT`: MySQL server port (default: "3306")
- `MYSQL_USER`: MySQL username (default: "root")
- `MYSQL_PASS`: MySQL password
- `MYSQL_DB`: Target database name

### Performance Configuration
- `MYSQL_POOL_SIZE`: Connection pool size (default: "10")
- `MYSQL_QUERY_TIMEOUT`: Query timeout in milliseconds (default: "30000")
- `MYSQL_CACHE_TTL`: Cache time-to-live in milliseconds (default: "60000")

### Security Configuration
- `MYSQL_RATE_LIMIT`: Maximum queries per minute (default: "100")
- `MYSQL_MAX_QUERY_COMPLEXITY`: Maximum query complexity score (default: "1000")
- `MYSQL_SSL`: Enable SSL/TLS encryption (default: "false")

### Monitoring Configuration
- `MYSQL_ENABLE_LOGGING`: Enable query logging (default: "false")
- `MYSQL_LOG_LEVEL`: Logging level (default: "info")
- `MYSQL_METRICS_ENABLED`: Enable performance metrics (default: "false")

## Testing

### Database Setup

Before running tests, you need to set up the test database and seed it with test data:

1. **Create Test Database and User**
   ```sql
   -- Connect as root and create test database
   CREATE DATABASE IF NOT EXISTS mcp_test;
   
   -- Create test user with appropriate permissions
   CREATE USER IF NOT EXISTS 'mcp_test'@'localhost' IDENTIFIED BY 'mcp_test_password';
   GRANT ALL PRIVILEGES ON mcp_test.* TO 'mcp_test'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Run Database Setup Script**
   ```bash
   # Run the database setup script
   pnpm run setup:test:db
   ```

   This will create the necessary tables and seed data. The script is located in `scripts/setup-test-db.ts`

3. **Configure Test Environment**
   Create a `.env.test` file in the project root:
   ```env
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_USER=mcp_test
   MYSQL_PASS=mcp_test_password
   MYSQL_DB=mcp_test
   ```

4. **Update package.json Scripts**
   Add these scripts to your package.json:
   ```json
   {
     "scripts": {
       "setup:test:db": "ts-node scripts/setup-test-db.ts",
       "pretest": "pnpm run setup:test:db",
       "test": "vitest run",
       "test:watch": "vitest",
       "test:coverage": "vitest run --coverage"
     }
   }
   ```

### Running Tests

The project includes a comprehensive test suite to ensure functionality and reliability:

```bash
# First-time setup
pnpm run setup:test:db

# Run all tests
pnpm test
```

## Troubleshooting

### Using Smithery for Troubleshooting
If you installed with Smithery, you can use its built-in diagnostics:

```bash
# Check the status of your MCP server
smithery status @benborla29/mcp-server-mysql

# Run diagnostics
smithery diagnose @benborla29/mcp-server-mysql

# View logs
smithery logs @benborla29/mcp-server-mysql
```

### Using MCP Get for Troubleshooting
If you installed with MCP Get:

```bash
# Check the status
mcp-get status @benborla29/mcp-server-mysql

# View logs
mcp-get logs @benborla29/mcp-server-mysql
```

### Common Issues

1. **Connection Issues**
   - Verify MySQL server is running and accessible
   - Check credentials and permissions
   - Ensure SSL/TLS configuration is correct if enabled
   - Try connecting with a MySQL client to confirm access

2. **Performance Issues**
   - Adjust connection pool size
   - Configure query timeout values
   - Enable query caching if needed
   - Check query complexity settings
   - Monitor server resource usage

3. **Security Restrictions**
   - Review rate limiting configuration
   - Check query whitelist/blacklist settings
   - Verify SSL/TLS settings
   - Ensure the user has appropriate MySQL permissions

4. **Path Resolution**
If you encounter an error "Could not connect to MCP server mcp-server-mysql", explicitly set the path of all required binaries:
```json
{
  "env": {
    "PATH": "/path/to/node/bin:/usr/bin:/bin"
  }
}
```

5. **Authentication Issues**
   - For MySQL 8.0+, ensure the server supports the `caching_sha2_password` authentication plugin
   - Check if your MySQL user is configured with the correct authentication method
   - Try creating a user with legacy authentication if needed:
     ```sql
     CREATE USER 'user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to 
https://github.com/benborla/mcp-server-mysql

### Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build the project: `pnpm run build`
4. Run tests: `pnpm test`

### Project Roadmap

We're actively working on enhancing this MCP server. Check our [CHANGELOG.md](./CHANGELOG.md) for details on planned features, including:

- Enhanced query capabilities with prepared statements
- Advanced security features
- Performance optimizations
- Comprehensive monitoring
- Expanded schema information

If you'd like to contribute to any of these areas, please check the issues on GitHub or open a new one to discuss your ideas.

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This MCP server is licensed under the MIT License. See the LICENSE file for details.
