import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../.env.test') });

async function setupTestDatabase() {
  // Create connection config, omitting password if empty
  const config: any = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    multipleStatements: true
  };

  // Only add password if it's set
  if (process.env.MYSQL_PASS) {
    config.password = process.env.MYSQL_PASS;
  }

  // First connect without database to create it if needed
  const connection = await mysql.createConnection(config);

  const dbName = process.env.MYSQL_DB || 'mcp_test';

  try {
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    
    // Switch to the test database
    await connection.query(`USE ${dbName}`);

    // Create test tables
    await connection.query(`
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS test_table;

      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE test_table (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert test users
      INSERT INTO users (name, email) VALUES
        ('Test User 1', 'test1@example.com'),
        ('Test User 2', 'test2@example.com'),
        ('Test User 3', 'test3@example.com');

      -- Insert test posts
      INSERT INTO posts (user_id, title, content) VALUES
        (1, 'First Post', 'Content of first post'),
        (1, 'Second Post', 'Content of second post'),
        (2, 'Another Post', 'Content of another post');

      -- Insert test data
      INSERT INTO test_table (name) VALUES
        ('Test 1'),
        ('Test 2'),
        ('Test 3');
    `);

    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

setupTestDatabase().catch(console.error); 