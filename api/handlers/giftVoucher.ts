import { Request, Response } from 'express';
import { VoucherGiftSchema, createVoucherGift, VoucherGiftMessage } from '../models/voucher';
import { SQSService } from '../services/sqs.service';
import { DynamoDBService } from '../services/dynamodb.service';
import { Logger } from '../utils/logger';

export async function giftVoucherHandler(req: Request, res: Response): Promise<void> {
  const handlerStart = Date.now();
  Logger.info('HANDLER', 'Processing gift voucher request');
  
  try {
    Logger.debug('VALIDATION', 'Validating voucher gift request data');
    const result = VoucherGiftSchema.safeParse(req.body);
    
    if (!result.success) {
      Logger.warn('VALIDATION', 'Validation failed for voucher gift request', {
        errors: result.error.format(),
      });
      
      res.status(400).json({
        success: false,
        error: result.error.format(),
      });
      return;
    }
    
    Logger.info('VALIDATION', 'Validation successful for voucher gift request');
    
    Logger.debug('VOUCHER', 'Creating voucher gift record');
    const voucherGift = createVoucherGift(result.data);
    Logger.info('VOUCHER', `Created voucher with ID: ${voucherGift.id}`, {
      voucherId: voucherGift.id,
      recipientType: voucherGift.recipientEmail ? 'email' : 'wallet',
      amount: voucherGift.amount,
      hasMessage: !!voucherGift.message,
    });
    
    Logger.debug('DATABASE', 'Saving voucher gift to DynamoDB', { voucherId: voucherGift.id });
    const savedVoucher = await DynamoDBService.saveVoucherGift(voucherGift);
    Logger.info('DATABASE', `Voucher saved to database: ${savedVoucher.id}`);
    
    const message: VoucherGiftMessage = {
      voucherId: voucherGift.id,
      recipientEmail: voucherGift.recipientEmail,
      walletAddress: voucherGift.walletAddress,
      amount: voucherGift.amount,
      message: voucherGift.message,
    };
    
    Logger.debug('QUEUE', 'Sending voucher gift message to SQS', { voucherId: voucherGift.id });
    const messageId = await SQSService.sendVoucherGiftMessage(message);
    Logger.info('QUEUE', `Message sent to SQS with ID: ${messageId}`, { messageId });
    
    const processingTime = Date.now() - handlerStart;
    Logger.info('HANDLER', `Voucher gift request processed successfully in ${processingTime}ms`, {
      voucherId: voucherGift.id,
      processingTime,
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: voucherGift.id,
        status: voucherGift.status,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - handlerStart;
    Logger.error('HANDLER', `Error processing voucher gift (${processingTime}ms)`, error);
    
    if (error instanceof Error) {
      Logger.debug('ERROR_DETAILS', 'Error details', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process voucher gift',
    });
  }
}
