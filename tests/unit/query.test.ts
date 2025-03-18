import { vi, describe, it, expect, beforeEach } from 'vitest';
import { executeQuery, executeReadOnlyQuery } from '../../dist/index.js';

// Mock mysql2/promise
vi.mock('mysql2/promise', () => {
  const mockConnection = {
    query: vi.fn(),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn()
  };

  const mockPool = {
    getConnection: vi.fn().mockResolvedValue(mockConnection)
  };

  return {
    createPool: vi.fn().mockReturnValue(mockPool)
  };
});

describe('Query Functions', () => {
  let mockPool;
  let mockConnection;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Get the mock pool and connection
    mockPool = (await import('mysql2/promise')).createPool({
      host: 'localhost',
      user: 'test',
      database: 'test'
    });
    mockConnection = await mockPool.getConnection();
  });

  describe('executeQuery', () => {
    it('should execute a query and return results', async () => {
      const mockResults = [{ id: 1, name: 'Test' }];
      mockConnection.query.mockResolvedValueOnce([mockResults, null]);

      const result = await executeQuery('SELECT * FROM test', []);
      
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    it('should handle query parameters correctly', async () => {
      const params = ['test', 123];
      mockConnection.query.mockResolvedValueOnce([[{ id: 1 }], null]);

      await executeQuery('SELECT * FROM test WHERE name = ? AND id = ?', params);
      
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM test WHERE name = ? AND id = ?',
        params
      );
    });

    it('should release connection even if query fails', async () => {
      mockConnection.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(executeQuery('SELECT * FROM test', [])).rejects.toThrow('Query failed');
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});