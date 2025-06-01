import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient, GIFT_VOUCHER_QUEUE_URL } from '../config/aws';
import { VoucherGiftMessage } from '../models/voucher';
import { Logger } from '../utils/logger';

export class SQSService {
    static async sendVoucherGiftMessage(message: VoucherGiftMessage): Promise<string> {
        const startTime = Date.now();
        Logger.info('SQS', 'Sending voucher gift message to SQS queue', {
            operation: 'sendVoucherGiftMessage',
            voucherId: message.voucherId,
            queueUrl: GIFT_VOUCHER_QUEUE_URL,
            recipientType: message.recipientEmail ? 'email' : 'wallet',
        });

        try {
            Logger.debug('SQS', 'Message payload details', {
                voucherId: message.voucherId,
                hasRecipientEmail: !!message.recipientEmail,
                hasWalletAddress: !!message.walletAddress,
                amount: message.amount,
                hasMessage: !!message.message,
            });

            const command = new SendMessageCommand({
                QueueUrl: GIFT_VOUCHER_QUEUE_URL,
                MessageBody: JSON.stringify(message),
                MessageAttributes: {
                    MessageType: {
                        DataType: 'String',
                        StringValue: 'VoucherGift',
                    },
                    VoucherId: {
                        DataType: 'String',
                        StringValue: message.voucherId,
                    },
                    RecipientType: {
                        DataType: 'String',
                        StringValue: message.recipientEmail ? 'email' : 'wallet',
                    },
                },
            });

            Logger.debug('SQS', 'Sending command to SQS');
            const response = await sqsClient.send(command);
            const duration = Date.now() - startTime;

            if (response.MessageId) {
                Logger.info(
                    'SQS',
                    `Successfully sent message to SQS in ${duration}ms, MessageId: ${response.MessageId}`,
                    {
                        operation: 'sendVoucherGiftMessage',
                        voucherId: message.voucherId,
                        messageId: response.MessageId,
                        duration,
                        sequenceNumber: response.SequenceNumber,
                        md5OfMessageBody: response.MD5OfMessageBody,
                    },
                );

                return response.MessageId;
            } else {
                Logger.warn('SQS', `Message sent but no MessageId returned (${duration}ms)`, {
                    operation: 'sendVoucherGiftMessage',
                    voucherId: message.voucherId,
                    duration,
                });

                return '';
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.error('SQS', `Error sending message to SQS (${duration}ms)`, error);

            if (error instanceof Error) {
                Logger.debug('ERROR_DETAILS', 'SQS error details', {
                    operation: 'sendVoucherGiftMessage',
                    voucherId: message.voucherId,
                    errorName: error.name,
                    errorMessage: error.message,
                    duration,
                });
            }

            throw new Error('Failed to send message to queue');
        }
    }
}
