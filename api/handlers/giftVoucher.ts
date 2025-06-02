import { Request, Response } from 'express';
import { VoucherGiftSchema, createVoucherGift, VoucherGiftMessage, HIGH_VALUE_THRESHOLD } from '../models/voucher';
import { SQSService } from '../services/sqs.service';
import { DynamoDBService } from '../services/dynamodb.service';
import { IdempotencyService } from '../services/idempotency.service';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle gift voucher requests with rate limiting, amount validation, and idempotency
 */
export async function giftVoucherHandler(req: Request, res: Response): Promise<void> {
    const handlerStart = Date.now();
    Logger.info('HANDLER', 'Processing gift voucher request');

    try {
        // Generate idempotency key if not provided
        if (!req.body.idempotencyKey) {
            req.body.idempotencyKey = IdempotencyService.generateKey();
            Logger.debug('IDEMPOTENCY', `Generated idempotency key: ${req.body.idempotencyKey}`);
        }
        
        // Check for existing request with the same idempotency key
        const existingVoucherId = await IdempotencyService.checkIdempotency(req.body.idempotencyKey);
        if (existingVoucherId) {
            Logger.info('IDEMPOTENCY', `Returning existing voucher for idempotency key: ${req.body.idempotencyKey}`, {
                voucherId: existingVoucherId
            });
            
            // Fetch the existing voucher
            const existingVoucher = await DynamoDBService.getVoucherGift(existingVoucherId);
            if (existingVoucher) {
                res.status(200).json({
                    success: true,
                    data: {
                        id: existingVoucher.id,
                        status: existingVoucher.status,
                        idempotent: true
                    },
                });
                return;
            }
        }
        
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
        
        // Log additional information for high-value vouchers
        const isHighValue = voucherGift.amount >= HIGH_VALUE_THRESHOLD;
        Logger.info('VOUCHER', `Created voucher with ID: ${voucherGift.id}`, {
            voucherId: voucherGift.id,
            recipientType: voucherGift.recipientEmail ? 'email' : 'wallet',
            amount: voucherGift.amount,
            isHighValue,
            hasMessage: !!voucherGift.message,
            idempotencyKey: req.body.idempotencyKey
        });

        Logger.debug('DATABASE', 'Saving voucher gift to DynamoDB', { voucherId: voucherGift.id });
        const savedVoucher = await DynamoDBService.saveVoucherGift(voucherGift);
        Logger.info('DATABASE', `Voucher saved to database: ${savedVoucher.id}`);
        
        // Save idempotency record to prevent duplicate processing
        await IdempotencyService.saveIdempotencyRecord(req.body.idempotencyKey, voucherGift.id);

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
                isHighValue: voucherGift.amount >= HIGH_VALUE_THRESHOLD,
                idempotencyKey: req.body.idempotencyKey
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
