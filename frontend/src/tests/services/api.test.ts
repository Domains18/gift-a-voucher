import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { giftVoucher, simulateProcessVoucher, API_BASE_URL } from '../../services/api';

vi.mock('axios');

describe('API Service', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('giftVoucher', () => {
        it('should successfully call the gift voucher API', async () => {
            // Arrange
            const mockResponse = {
                data: {
                    id: 'test-voucher-id',
                    status: 'PENDING',
                    recipientEmail: 'test@example.com',
                    amount: 100,
                    message: 'Test message',
                },
            };

            (axios.post as any).mockResolvedValueOnce(mockResponse);

            const voucherData = {
                recipientEmail: 'test@example.com',
                amount: 100,
                message: 'Test message',
            };

            // Act
            const result = await giftVoucher(voucherData);

            // Assert
            expect(axios.post).toHaveBeenCalledWith('/api/vouchers/gift', voucherData);
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle API errors', async () => {
            // Arrange
            const errorMessage = 'Network Error';
            (axios.post as any).mockRejectedValueOnce(new Error(errorMessage));

            const voucherData = {
                walletAddress: '0x1234567890abcdef',
                amount: 50,
            };

            // Act & Assert
            await expect(giftVoucher(voucherData)).rejects.toThrow(errorMessage);
        });
    });

    describe('simulateProcessVoucher', () => {
        it('should successfully call the process voucher API', async () => {
            // Arrange
            const mockResponse = {
                data: {
                    success: true,
                    message: 'Voucher processing initiated',
                },
            };

            (axios.post as any).mockResolvedValueOnce(mockResponse);

            // Create a valid VoucherGiftRequest object
            const voucherRequest = {
                recipientEmail: 'test@example.com',
                amount: 100,
                message: 'Test message',
            };

            // Act
            const result = await simulateProcessVoucher(voucherRequest);

            // Assert
            expect(axios.post).toHaveBeenCalledWith(`${API_BASE_URL}/simulate/process-voucher`, voucherRequest);
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle API errors', async () => {
            // Arrange
            const errorMessage = 'Server Error';
            (axios.post as any).mockRejectedValueOnce(new Error(errorMessage));

            // Create a valid VoucherGiftRequest object
            const voucherRequest = {
                walletAddress: '0x1234567890abcdef',
                amount: 50,
            };

            // Act & Assert
            await expect(simulateProcessVoucher(voucherRequest)).rejects.toThrow(errorMessage);
        });
    });
});
