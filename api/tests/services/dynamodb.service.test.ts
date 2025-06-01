import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamoDBService } from '../../services/dynamodb.service';
import { dynamoDbDocClient } from '../../config/aws';
import { createVoucherGift } from '../../models/voucher';

// Mock AWS SDK
vi.mock('../../config/aws', () => ({
    dynamoDbDocClient: {
        send: vi.fn(),
    },
    VOUCHERS_TABLE_NAME: 'test-vouchers-table',
}));

describe('DynamoDBService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('saveVoucherGift', () => {
        it('should save a voucher gift to DynamoDB', async () => {
            // Arrange
            const mockVoucher = createVoucherGift({
                recipientEmail: 'test@example.com',
                amount: 100,
                message: 'Test message',
            });

            // Mock successful response
            (dynamoDbDocClient.send as any).mockResolvedValueOnce({});

            // Act
            const result = await DynamoDBService.saveVoucherGift(mockVoucher);

            // Assert
            expect(dynamoDbDocClient.send).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVoucher);
        });

        it('should throw an error when DynamoDB operation fails', async () => {
            // Arrange
            const mockVoucher = createVoucherGift({
                recipientEmail: 'test@example.com',
                amount: 100,
            });

            // Mock error response
            const mockError = new Error('DynamoDB error');
            (dynamoDbDocClient.send as any).mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(DynamoDBService.saveVoucherGift(mockVoucher)).rejects.toThrow('Failed to save voucher gift');
        });
    });

    describe('getVoucherGift', () => {
        it('should retrieve a voucher gift by ID', async () => {
            // Arrange
            const mockVoucher = createVoucherGift({
                recipientEmail: 'test@example.com',
                amount: 100,
            });

            // Mock successful response
            (dynamoDbDocClient.send as any).mockResolvedValueOnce({
                Item: mockVoucher,
            });

            // Act
            const result = await DynamoDBService.getVoucherGift(mockVoucher.id);

            // Assert
            expect(dynamoDbDocClient.send).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockVoucher);
        });

        it('should return null when voucher is not found', async () => {
            // Arrange
            // Mock empty response
            (dynamoDbDocClient.send as any).mockResolvedValueOnce({});

            // Act
            const result = await DynamoDBService.getVoucherGift('non-existent-id');

            // Assert
            expect(dynamoDbDocClient.send).toHaveBeenCalledTimes(1);
            expect(result).toBeNull();
        });
    });

    describe('updateVoucherStatus', () => {
        it('should update the status of a voucher gift', async () => {
            // Arrange
            const mockId = 'test-id';
            const mockStatus = 'SENT';

            // Mock successful response
            (dynamoDbDocClient.send as any).mockResolvedValueOnce({
                Attributes: {
                    id: mockId,
                    status: mockStatus,
                },
            });

            // Act
            const result = await DynamoDBService.updateVoucherStatus(mockId, mockStatus);

            // Assert
            expect(dynamoDbDocClient.send).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                id: mockId,
                status: mockStatus,
            });
        });

        it('should throw an error when update operation fails', async () => {
            // Arrange
            const mockId = 'test-id';
            const mockStatus = 'SENT';

            // Mock error response
            const mockError = new Error('DynamoDB error');
            (dynamoDbDocClient.send as any).mockRejectedValueOnce(mockError);

            // Act & Assert
            await expect(DynamoDBService.updateVoucherStatus(mockId, mockStatus)).rejects.toThrow(
                'Failed to update voucher status',
            );
        });
    });
});
