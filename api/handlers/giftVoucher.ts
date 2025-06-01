import { Request, Response } from 'express';
import { VoucherGiftSchema, createVoucherGift, VoucherGiftMessage } from '../models/voucher';
import { SQSService } from '../services/sqs.service';
import { DynamoDBService } from '../services/dynamodb.service';

export async function giftVoucherHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = VoucherGiftSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error.format(),
      });
      return;
    }

    const voucherGift = createVoucherGift(result.data);
    
    await DynamoDBService.saveVoucherGift(voucherGift);
    
    const message: VoucherGiftMessage = {
      voucherId: voucherGift.id,
      recipientEmail: voucherGift.recipientEmail,
      walletAddress: voucherGift.walletAddress,
      amount: voucherGift.amount,
      message: voucherGift.message,
    };
    
    await SQSService.sendVoucherGiftMessage(message);
    
    res.status(200).json({
      success: true,
      data: {
        id: voucherGift.id,
        status: voucherGift.status,
      },
    });
  } catch (error) {
    console.error('Error processing voucher gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voucher gift',
    });
  }
}
