import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdempotencyService } from '../../services/idempotency.service';
import { DynamoDBService } from '../../services/dynamodb.service';
import { Logger } from '../../utils/logger';

// Mock dependencies
vi.mock('../../services/dynamodb.service');
vi.mock('../../utils/logger');
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid-123')
}));

describe('IdempotencyService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('generateKey', () => {
    it('should generate a UUID', () => {
      const key = IdempotencyService.generateKey();
      expect(key).toBe('test-uuid-123');
    });
  });

  describe('checkIdempotency', () => {
    it('should return null if no key is provided', async () => {
      const result = await IdempotencyService.checkIdempotency('');
      expect(result).toBeNull();
      expect(DynamoDBService.getItem).not.toHaveBeenCalled();
    });

    it('should return null if no record is found', async () => {
      // Mock DynamoDBService.getItem to return null
      (DynamoDBService.getItem as any).mockResolvedValue(null);

      const result = await IdempotencyService.checkIdempotency('test-key');
      expect(result).toBeNull();
      expect(DynamoDBService.getItem).toHaveBeenCalledWith(
        'idempotency-records',
        { key: 'test-key' }
      );
    });

    it('should return resourceId if record is found', async () => {
      // Mock DynamoDBService.getItem to return a record
      const mockRecord = {
        key: 'test-key',
        resourceId: 'test-resource-id',
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 7
      };
      (DynamoDBService.getItem as any).mockResolvedValue(mockRecord);

      const result = await IdempotencyService.checkIdempotency('test-key');
      expect(result).toBe('test-resource-id');
      expect(DynamoDBService.getItem).toHaveBeenCalledWith(
        'idempotency-records',
        { key: 'test-key' }
      );
      expect(Logger.info).toHaveBeenCalledTimes(1);
      expect(Logger.info).toHaveBeenCalledWith(
        'IDEMPOTENCY',
        expect.stringContaining('Found existing record'),
        expect.objectContaining({ resourceId: 'test-resource-id' })
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock DynamoDBService.getItem to throw an error
      (DynamoDBService.getItem as any).mockRejectedValue(new Error('DB error'));

      const result = await IdempotencyService.checkIdempotency('test-key');
      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalledTimes(1);
      expect(Logger.error).toHaveBeenCalledWith(
        'IDEMPOTENCY',
        expect.stringContaining('Error checking idempotency'),
        expect.any(Error)
      );
    });
  });

  describe('saveIdempotencyRecord', () => {
    it('should save a record with TTL', async () => {
      // Save the original Date constructor
      const OriginalDate = global.Date;
      
      // Mock fixed date for consistent testing
      const mockDate = new Date('2021-06-07T12:00:00.000Z');
      const mockTimestamp = mockDate.getTime(); // 1623067200000
      
      // Mock the Date constructor and methods
      class MockDate extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockTimestamp;
        }
      }
      
      try {
        // Replace the global Date with our mock
        global.Date = MockDate as any;
        
        // Mock DynamoDBService.putItem to succeed
        (DynamoDBService.putItem as any).mockResolvedValue({});
        
        // Call the function
        await IdempotencyService.saveIdempotencyRecord('test-key', 'test-resource-id');
        
        // Calculate expected TTL (current time + 7 days in seconds)
        // The IdempotencyService adds 7 days to the date and converts to unix timestamp
        // 2021-06-07T12:00:00.000Z + 7 days = 2021-06-14T12:00:00.000Z
        const expectedTTL = Math.floor((mockTimestamp + (7 * 24 * 60 * 60 * 1000)) / 1000);
        
        // Get the actual call arguments
        const putItemCalls = vi.mocked(DynamoDBService.putItem).mock.calls;
        expect(putItemCalls.length).toBe(1);
        
        const [tableName, item] = putItemCalls[0];
        expect(tableName).toBe('idempotency-records');
        
        // Type assertion for the item
        const typedItem = item as {
          id: string;
          key: string;
          resourceId: string;
          createdAt: string;
          expiresAt: number;
        };
        
        expect(typedItem.id).toBe('test-uuid-123');
        expect(typedItem.key).toBe('test-key');
        expect(typedItem.resourceId).toBe('test-resource-id');
        expect(typeof typedItem.createdAt).toBe('string');
        expect(typedItem.expiresAt).toBe(expectedTTL);
      } finally {
        // Restore original Date
        global.Date = OriginalDate;
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock DynamoDBService.putItem to throw an error
      (DynamoDBService.putItem as any).mockRejectedValue(new Error('DB error'));

      const key = 'test-key';
      const resourceId = 'test-resource-id';
      
      await IdempotencyService.saveIdempotencyRecord(key, resourceId);
      expect(Logger.error).toHaveBeenCalledTimes(1);
      expect(Logger.error).toHaveBeenCalledWith(
        'IDEMPOTENCY',
        expect.stringContaining('Error saving idempotency record'),
        expect.any(Error)
      );
    });
  });
});
