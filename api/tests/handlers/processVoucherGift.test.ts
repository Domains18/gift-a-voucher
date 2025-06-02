import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processVoucherGiftHandler, localProcessVoucherGift } from '../../handlers/processVoucherGift';
import { DynamoDBService } from '../../services/dynamodb.service';
import { SQSEvent, SQSRecord } from '../../types/aws-lambda';

// Store original Math.random
const originalMathRandom = Math.random;

vi.mock('../../services/dynamodb.service', () => ({
    DynamoDBService: {
        updateVoucherStatus: vi.fn(),
    },
}));

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('processVoucherGift', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        console.log = vi.fn();
        console.error = vi.fn();
        
        // Mock Math.random to return 0.5 (above the 0.1 threshold for random errors)
        Math.random = vi.fn().mockReturnValue(0.5);
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        Math.random = originalMathRandom;
    });

    describe('processVoucherGiftHandler', () => {
        it('should process all records in the event', async () => {
            const mockEvent: SQSEvent = {
                Records: [
                    createMockSQSRecord({
                        voucherId: 'test-id-1',
                        recipientEmail: 'test1@example.com',
                        amount: 100,
                    }),
                    createMockSQSRecord({
                        voucherId: 'test-id-2',
                        walletAddress: '0x1234567890abcdef',
                        amount: 50,
                    }),
                ],
            };

            (DynamoDBService.updateVoucherStatus as any).mockResolvedValue({ id: 'test-id', status: 'SENT' });

            await processVoucherGiftHandler(mockEvent);

            expect(DynamoDBService.updateVoucherStatus).toHaveBeenCalledTimes(2);
            // Check for completion log - using a more flexible pattern
            expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/Processing complete/i));
        });

        it('should handle errors during processing', async () => {
            const mockEvent: SQSEvent = {
                Records: [
                    createMockSQSRecord({
                        voucherId: 'test-id-1',
                        recipientEmail: 'test1@example.com',
                        amount: 100,
                    }),
                ],
            };

            (DynamoDBService.updateVoucherStatus as any).mockRejectedValueOnce(new Error('Test error'));

            await processVoucherGiftHandler(mockEvent);

            // Check for error log - using a more flexible pattern
            expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/Error processing voucher gift/i));
        });
    });

    describe('localProcessVoucherGift', () => {
        it('should process a message body', async () => {
            const mockMessage = {
                voucherId: 'test-id',
                recipientEmail: 'test@example.com',
                amount: 100,
            };

            (DynamoDBService.updateVoucherStatus as any).mockResolvedValue({ id: 'test-id', status: 'SENT' });

            await localProcessVoucherGift(JSON.stringify(mockMessage));

            expect(DynamoDBService.updateVoucherStatus).toHaveBeenCalledWith('test-id', 'SENT');
        });
    });
});

function createMockSQSRecord(messageBody: any): SQSRecord {
    return {
        messageId: `mock-message-id-${Date.now()}`,
        receiptHandle: 'mock-receipt-handle',
        body: JSON.stringify(messageBody),
        attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: Date.now().toString(),
            SenderId: 'mock-sender-id',
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
        },
        messageAttributes: {},
        md5OfBody: 'mock-md5',
        eventSource: 'aws:sqs',
        eventSourceARN: 'mock-arn',
        awsRegion: 'us-east-1',
    };
}
