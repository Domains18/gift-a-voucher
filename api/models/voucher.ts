import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Constants for amount limits
export const MIN_AMOUNT = 1; // $1
export const MAX_AMOUNT = 10000; // $10,000
export const HIGH_VALUE_THRESHOLD = 1000; // $1,000 (requires confirmation)

export const VoucherGiftSchema = z
    .object({
        recipientEmail: z.string().email().optional(),
        walletAddress: z.string().optional(),
        amount: z.number()
            .positive('Amount must be a positive number')
            .min(MIN_AMOUNT, `Amount must be at least $${MIN_AMOUNT}`)
            .max(MAX_AMOUNT, `Amount cannot exceed $${MAX_AMOUNT}`),
        message: z.string().optional(),
        // Add idempotency key for preventing duplicate submissions
        idempotencyKey: z.string().uuid().optional(),
        // For high-value vouchers, require confirmation
        confirmHighValue: z.boolean().optional(),
    })
    .refine(data => data.recipientEmail || data.walletAddress, {
        message: 'Either recipientEmail or walletAddress must be provided',
    })
    .refine(
        data => !(data.amount >= HIGH_VALUE_THRESHOLD) || data.confirmHighValue === true,
        {
            message: `High-value vouchers ($${HIGH_VALUE_THRESHOLD}+) require confirmation`,
            path: ['confirmHighValue'],
        }
    );

export type VoucherGiftRequest = z.infer<typeof VoucherGiftSchema>;

export interface VoucherGift extends VoucherGiftRequest {
    id: string;
    createdAt: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
}

export function createVoucherGift(request: VoucherGiftRequest): VoucherGift {
    return {
        ...request,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        status: 'PENDING',
    };
}

export interface VoucherGiftMessage {
    voucherId: string;
    recipientEmail?: string;
    walletAddress?: string;
    amount: number;
    message?: string;
}
