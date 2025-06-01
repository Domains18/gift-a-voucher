import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SQSService } from '../../services/sqs.service';
import { sqsClient } from '../../config/aws';
import { VoucherGiftMessage } from '../../models/voucher';

// Mock AWS SDK
vi.mock('../../config/aws', () => ({
  sqsClient: {
    send: vi.fn(),
  },
  GIFT_VOUCHER_QUEUE_URL: 'https://sqs.test-region.amazonaws.com/test-queue',
}));

describe('SQSService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('sendVoucherGiftMessage', () => {
    it('should send a message to SQS and return the message ID', async () => {
      // Arrange
      const mockMessage: VoucherGiftMessage = {
        voucherId: 'test-id',
        recipientEmail: 'test@example.com',
        amount: 100,
        message: 'Test message',
      };
      
      const mockMessageId = 'test-message-id';
      
      // Mock successful response
      (sqsClient.send as any).mockResolvedValueOnce({
        MessageId: mockMessageId,
      });

      // Act
      const result = await SQSService.sendVoucherGiftMessage(mockMessage);

      // Assert
      expect(sqsClient.send).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockMessageId);
    });

    it('should throw an error when SQS operation fails', async () => {
      // Arrange
      const mockMessage: VoucherGiftMessage = {
        voucherId: 'test-id',
        walletAddress: '0x1234567890abcdef',
        amount: 50,
      };
      
      // Mock error response
      const mockError = new Error('SQS error');
      (sqsClient.send as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(SQSService.sendVoucherGiftMessage(mockMessage)).rejects.toThrow('Failed to send message to queue');
    });
  });
});
