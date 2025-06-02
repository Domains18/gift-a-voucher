import { DynamoDBService } from './dynamodb.service';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';

// Interface for idempotency records
interface IdempotencyRecord {
  id: string;
  key: string;
  resourceId: string;
  createdAt: string;
  expiresAt: number; // TTL for DynamoDB
}

export class IdempotencyService {
  private static readonly TABLE_NAME = 'idempotency-records';
  private static readonly EXPIRY_DAYS = 7; // Records expire after 7 days

  /**
   * Generate a new idempotency key
   * @returns A UUID v4 string
   */
  static generateKey(): string {
    return uuidv4();
  }

  /**
   * Check if a request with the given idempotency key has been processed before
   * @param key The idempotency key
   * @returns The existing resource ID if found, null otherwise
   */
  static async checkIdempotency(key: string): Promise<string | null> {
    try {
      if (!key) {
        return null;
      }

      Logger.debug('IDEMPOTENCY', `Checking idempotency for key: ${key}`);
      
      const record = await DynamoDBService.getItem<IdempotencyRecord>(
        this.TABLE_NAME,
        { key }
      );

      if (record) {
        Logger.info('IDEMPOTENCY', `Found existing record for key: ${key}`, { 
          resourceId: record.resourceId 
        });
        return record.resourceId;
      }

      return null;
    } catch (error) {
      Logger.error('IDEMPOTENCY', 'Error checking idempotency', error);
      // In case of error, we proceed with the request to avoid blocking legitimate requests
      return null;
    }
  }

  /**
   * Save an idempotency record for a processed request
   * @param key The idempotency key
   * @param resourceId The ID of the created resource
   */
  static async saveIdempotencyRecord(key: string, resourceId: string): Promise<void> {
    try {
      if (!key) {
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + this.EXPIRY_DAYS);

      const record: IdempotencyRecord = {
        id: uuidv4(),
        key,
        resourceId,
        createdAt: now.toISOString(),
        expiresAt: Math.floor(expiryDate.getTime() / 1000) // Unix timestamp for TTL
      };

      Logger.debug('IDEMPOTENCY', `Saving idempotency record for key: ${key}`, { resourceId });
      await DynamoDBService.putItem(this.TABLE_NAME, record);
      Logger.info('IDEMPOTENCY', `Saved idempotency record for key: ${key}`, { resourceId });
    } catch (error) {
      Logger.error('IDEMPOTENCY', 'Error saving idempotency record', error);
      // We don't throw here to avoid failing the main request flow
    }
  }
}
