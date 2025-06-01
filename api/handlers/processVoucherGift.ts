import { SQSEvent, SQSRecord } from '../types/aws-lambda';
import { DynamoDBService } from '../services/dynamodb.service';
import { VoucherGiftMessage } from '../models/voucher';

/**
 * Processes a single SQS record containing a voucher gift message
 * @param record The SQS record to process
 */
async function processRecord(record: SQSRecord): Promise<void> {
  try {
    // Parse the message body
    const message: VoucherGiftMessage = JSON.parse(record.body);
    console.log('Processing voucher gift:', message);

    // Simulate sending the gift
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

    // Update the voucher status in DynamoDB
    await DynamoDBService.updateVoucherStatus(message.voucherId, 'SENT');
    console.log(`Voucher gift ${message.voucherId} processed successfully`);
  } catch (error) {
    console.error('Error processing voucher gift:', error);
    
    // If we have the voucher ID, update the status to FAILED
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
    
    throw error; // Re-throw to let the Lambda runtime handle it
  }
}

/**
 * Lambda handler function for processing voucher gift messages from SQS
 * @param event The SQS event containing records to process
 */
export async function processVoucherGiftHandler(event: SQSEvent): Promise<void> {
  console.log(`Received ${event.Records.length} records to process`);
  
  // Process each record in the batch
  const promises = event.Records.map(processRecord);
  
  // Wait for all records to be processed
  await Promise.all(promises);
  
  console.log('All records processed successfully');
}

// For local testing without AWS Lambda
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
