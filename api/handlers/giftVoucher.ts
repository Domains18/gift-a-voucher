import { Request, Response } from 'express';
import { VoucherGiftSchema, createVoucherGift, VoucherGiftMessage } from '../models/voucher';
import { SQSService } from '../services/sqs.service';
import { DynamoDBService } from '../services/dynamodb.service';

/**
 * Handler for the gift voucher API endpoint
 * @param req Express request object
 * @param res Express response object
 */
export async function giftVoucherHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate the request body
    const result = VoucherGiftSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error.format(),
      });
      return;
    }

    // Create a voucher gift record
    const voucherGift = createVoucherGift(result.data);
    
    // Save the voucher gift to DynamoDB
    await DynamoDBService.saveVoucherGift(voucherGift);
    
    // Prepare the message for SQS
    const message: VoucherGiftMessage = {
      voucherId: voucherGift.id,
      recipientEmail: voucherGift.recipientEmail,
      walletAddress: voucherGift.walletAddress,
      amount: voucherGift.amount,
      message: voucherGift.message,
    };
    
    // Send the message to SQS
    await SQSService.sendVoucherGiftMessage(message);
    
    // Return success response
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
