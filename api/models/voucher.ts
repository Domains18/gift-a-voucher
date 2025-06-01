import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Define the schema for voucher gift request
export const VoucherGiftSchema = z.object({
  recipientEmail: z.string().email().optional(),
  walletAddress: z.string().optional(),
  amount: z.number().positive(),
  message: z.string().optional(),
}).refine(data => data.recipientEmail || data.walletAddress, {
  message: "Either recipientEmail or walletAddress must be provided",
});

// Type for voucher gift request
export type VoucherGiftRequest = z.infer<typeof VoucherGiftSchema>;

// Type for voucher gift record (as stored in DynamoDB)
export interface VoucherGift extends VoucherGiftRequest {
  id: string;
  createdAt: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

// Function to create a new voucher gift record
export function createVoucherGift(request: VoucherGiftRequest): VoucherGift {
  return {
    ...request,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    status: 'PENDING',
  };
}

// Type for SQS message payload
export interface VoucherGiftMessage {
  voucherId: string;
  recipientEmail?: string;
  walletAddress?: string;
  amount: number;
  message?: string;
}
