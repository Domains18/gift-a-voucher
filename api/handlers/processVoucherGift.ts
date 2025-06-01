import { SQSEvent, SQSRecord } from '../types/aws-lambda';
import { DynamoDBService } from '../services/dynamodb.service';
import { VoucherGiftMessage } from '../models/voucher';

// Constants for retry handling
const MAX_RETRY_COUNT = 3;
const RETRY_ERRORS = ['ConnectionError', 'TimeoutError', 'NetworkError'];

// Monitoring metrics
const metrics = {
  processedCount: 0,
  failedCount: 0,
  retryCount: 0,
  dlqCount: 0,
  processingTimeMs: 0
};

async function processRecord(record: SQSRecord): Promise<void> {
  const startTime = Date.now();
  const receiveCount = parseInt(record.attributes.ApproximateReceiveCount, 10);
  console.log(`[MONITOR] Processing message ${record.messageId}, receive count: ${receiveCount}`);
  
  try {
    const message: VoucherGiftMessage = JSON.parse(record.body);
    console.log(`[MONITOR] Processing voucher gift: ${message.voucherId}`);

    // Simulate a random error for testing retry logic (10% chance of failure)
    if (Math.random() < 0.1) {
      const errorTypes = ['ConnectionError', 'TimeoutError', 'ValidationError'];
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      throw new Error(randomError);
    }

    // Process the message
    if (message.recipientEmail) {
      console.log(`[MONITOR] Sending voucher gift email to ${message.recipientEmail}`);
      console.log(`[MONITOR] Amount: ${message.amount}`);
      if (message.message) {
        console.log(`[MONITOR] Message: ${message.message}`);
      }
    } else if (message.walletAddress) {
      console.log(`[MONITOR] Sending voucher gift to wallet ${message.walletAddress}`);
      console.log(`[MONITOR] Amount: ${message.amount}`);
      if (message.message) {
        console.log(`[MONITOR] Message: ${message.message}`);
      }
    }

    await DynamoDBService.updateVoucherStatus(message.voucherId, 'SENT');
    console.log(`[MONITOR] Voucher gift ${message.voucherId} processed successfully`);
    
    // Update metrics
    metrics.processedCount++;
    metrics.processingTimeMs += (Date.now() - startTime);
    
    // Log metrics for monitoring
    console.log(`[METRICS] ${JSON.stringify(metrics)}`);
  } catch (error: any) {
    metrics.failedCount++;
    console.error(`[MONITOR] Error processing voucher gift: ${error.message}`);
    
    // Check if we should retry based on error type and retry count
    const shouldRetry = RETRY_ERRORS.some(retryError => error.message.includes(retryError));
    const canRetry = receiveCount < MAX_RETRY_COUNT;
    
    if (shouldRetry && canRetry) {
      console.log(`[MONITOR] Message will be retried, current count: ${receiveCount}`);
      metrics.retryCount++;
      // In a real environment, we would let the SQS visibility timeout expire to retry
      // For this simulation, we're just logging the retry intent
    } else if (receiveCount >= MAX_RETRY_COUNT) {
      console.log(`[MONITOR] Message exceeded max retries, sending to DLQ`);
      metrics.dlqCount++;
      // In a real environment, this would be handled by SQS redrive policy to DLQ
      // For this simulation, we're just logging the DLQ intent
    }
    
    if (record.body) {
      try {
        const message: VoucherGiftMessage = JSON.parse(record.body);
        if (message.voucherId) {
          if (receiveCount >= MAX_RETRY_COUNT) {
            await DynamoDBService.updateVoucherStatus(message.voucherId, 'FAILED');
            console.log(`[MONITOR] Updated voucher ${message.voucherId} status to FAILED after max retries`);
          } else if (shouldRetry) {
            // We could add a 'RETRYING' status if needed
            console.log(`[MONITOR] Voucher ${message.voucherId} will be retried`);
          } else {
            await DynamoDBService.updateVoucherStatus(message.voucherId, 'FAILED');
            console.log(`[MONITOR] Updated voucher ${message.voucherId} status to FAILED due to non-retryable error`);
          }
        }
      } catch (parseError) {
        console.error(`[MONITOR] Error parsing message body: ${parseError}`);
      }
    }
    
    // Log metrics for monitoring
    console.log(`[METRICS] ${JSON.stringify(metrics)}`);
    
    // Only rethrow retryable errors if we haven't exceeded max retries
    // This allows SQS to retry the message
    if (shouldRetry && canRetry) {
      throw error;
    }
  }
}

export async function processVoucherGiftHandler(event: SQSEvent): Promise<void> {
  console.log(`[MONITOR] Received ${event.Records.length} records to process`);
  
  // Process records sequentially to better handle errors
  // In a production environment with high throughput, you might want to process in batches
  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error(`[MONITOR] Failed to process record ${record.messageId}: ${error}`);
      // In AWS Lambda, throwing an error will cause the entire batch to be retried
      // For specific records that shouldn't be retried, we handle that in processRecord
    }
  }
  
  console.log(`[MONITOR] Processing complete. Metrics: ${JSON.stringify(metrics)}`);
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
