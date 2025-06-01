import { SQSEvent, SQSRecord } from '../types/aws-lambda';
import { DynamoDBService } from '../services/dynamodb.service';
import { VoucherGiftMessage } from '../models/voucher';

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const message: VoucherGiftMessage = JSON.parse(record.body);
    console.log('Processing voucher gift:', message);

    //simulation
    if (message.recipientEmail) {
      console.log(`Sending voucher gift email to ${message.recipientEmail}`);
      console.log(`Amount: ${message.amount}`);
      if (message.message) {
        console.log(`Message: ${message.message}`);
      }
    } else if (message.walletAddress) {
      console.log(`Sending voucher gift to wallet ${message.walletAddress}`);
      console.log(`Amount: ${message.amount}`);
      if (message.message) {
        console.log(`Message: ${message.message}`);
      }
    }

    await DynamoDBService.updateVoucherStatus(message.voucherId, 'SENT');
    console.log(`Voucher gift ${message.voucherId} processed successfully`);
  } catch (error) {
    console.error('Error processing voucher gift:', error);
    
    if (record.body) {
      try {
        const message: VoucherGiftMessage = JSON.parse(record.body);
        if (message.voucherId) {
          await DynamoDBService.updateVoucherStatus(message.voucherId, 'FAILED');
        }
      } catch (parseError) {
        console.error('Error parsing message body:', parseError);
      }
    }
    
    throw error;
  }
}

export async function processVoucherGiftHandler(event: SQSEvent): Promise<void> {
  console.log(`Received ${event.Records.length} records to process`);
  
  const promises = event.Records.map(processRecord);
  
  await Promise.all(promises);
  
  console.log('All records processed successfully');
}

export async function localProcessVoucherGift(messageBody: string): Promise<void> {
  const mockRecord: SQSRecord = {
    messageId: 'mock-message-id',
    receiptHandle: 'mock-receipt-handle',
    body: messageBody,
    attributes: {
      ApproximateReceiveCount: '1',
      SentTimestamp: Date.now().toString(),
      SenderId: 'mock-sender-id',
      ApproximateFirstReceiveTimestamp: Date.now().toString()
    },
    messageAttributes: {},
    md5OfBody: 'mock-md5',
    eventSource: 'aws:sqs',
    eventSourceARN: 'mock-arn',
    awsRegion: 'us-east-1'
  };
  
  await processRecord(mockRecord);
}
