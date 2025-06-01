import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient, GIFT_VOUCHER_QUEUE_URL } from '../config/aws';
import { VoucherGiftMessage } from '../models/voucher';

export class SQSService {
    static async sendVoucherGiftMessage(message: VoucherGiftMessage): Promise<string> {
        try {
            const command = new SendMessageCommand({
                QueueUrl: GIFT_VOUCHER_QUEUE_URL,
                MessageBody: JSON.stringify(message),
                MessageAttributes: {
                    MessageType: {
                        DataType: 'String',
                        StringValue: 'VoucherGift',
                    },
                },
            });

            const response = await sqsClient.send(command);
            return response.MessageId || '';
        } catch (error) {
            console.error('Error sending message to SQS:', error);
            throw new Error('Failed to send message to queue');
        }
    }
}
