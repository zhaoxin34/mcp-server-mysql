import * as mysql2 from 'mysql2/promise';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

describe('MySQL Integration', () => {
  let pool: any;
  
  beforeAll(async () => {
    // Create a connection pool for testing
    const config: any = {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      database: process.env.MYSQL_DB || 'mcp_test',
      connectionLimit: 5,
      multipleStatements: true
    };

    // Only add password if it's set
    if (process.env.MYSQL_PASS) {
      config.password = process.env.MYSQL_PASS;
    }

    pool = mysql2.createPool(config);
    
    // Create a test table if it doesn't exist
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Clear the table
      await connection.query('TRUNCATE TABLE test_table');
      
      // Insert test data
      await connection.query(`
        INSERT INTO test_table (name) VALUES 
        ('Test 1'),
        ('Test 2'),
        ('Test 3')
      `);
    } finally {
      connection.release();
    }
  });
  
  afterAll(async () => {
    // Clean up test data
    const connection = await pool.getConnection();
    try {
      await connection.query('DROP TABLE IF EXISTS test_table');
    } finally {
      connection.release();
    }
    
    // Close the pool
    await pool.end();
  });
  
  it('should connect to the database', async () => {
    const connection = await pool.getConnection();
    expect(connection).toBeDefined();
    connection.release();
  });
  
  it('should execute a query and return results', async () => {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM test_table') as [any[], any];
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(3);
    } finally {
      connection.release();
    }
  });
  
  it('should execute a parameterized query', async () => {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM test_table WHERE name = ?',
        ['Test 2']
      ) as [any[], any];
      
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe('Test 2');
    } finally {
      connection.release();
    }
  });
  
  it('should handle transactions correctly', async () => {
    const connection = await pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Insert a new record
      await connection.query(
        'INSERT INTO test_table (name) VALUES (?)',
        ['Transaction Test']
      );
      
      // Verify the record exists
      const [rows] = await connection.query(
        'SELECT * FROM test_table WHERE name = ?',
        ['Transaction Test']
      ) as [any[], any];
      
      expect(rows.length).toBe(1);
      
      // Rollback the transaction
      await connection.rollback();
      
      // Verify the record no longer exists
      const [rowsAfterRollback] = await connection.query(
        'SELECT * FROM test_table WHERE name = ?',
        ['Transaction Test']
      ) as [any[], any];
      
      expect(rowsAfterRollback.length).toBe(0);
    } finally {
      connection.release();
    }
  });
}); 