import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const VoucherGiftSchema = z
    .object({
        recipientEmail: z.string().email().optional(),
        walletAddress: z.string().optional(),
        amount: z.number().positive(),
        message: z.string().optional(),
    })
    .refine(data => data.recipientEmail || data.walletAddress, {
        message: 'Either recipientEmail or walletAddress must be provided',
    });

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
