import { SQSEvent, SQSRecord } from '../types/aws-lambda';
import { DynamoDBService } from '../services/dynamodb.service';
import { VoucherGiftMessage } from '../models/voucher';
import { Logger } from '../utils/logger';

const MAX_RETRY_COUNT = 3;
const RETRY_ERRORS = ['ConnectionError', 'TimeoutError', 'NetworkError'];

const metrics = {
  processedCount: 0,
  failedCount: 0,
  retryCount: 0,
  dlqCount: 0,
  processingTimeMs: 0,
  lastProcessedAt: new Date().toISOString(),
  lastFailedAt: null as string | null,
  lastErrorMessage: null as string | null
};

function logMetrics(context: string) {
  Logger.info('METRICS', `Processing metrics for ${context}`, metrics);
}

async function processRecord(record: SQSRecord): Promise<void> {
  const startTime = Date.now();
  const receiveCount = parseInt(record.attributes.ApproximateReceiveCount, 10);
  const messageId = record.messageId;
  
  Logger.info('PROCESSOR', `Processing message ${messageId}`, {
    messageId,
    receiveCount,
    sentTimestamp: record.attributes.SentTimestamp,
    approximateFirstReceiveTimestamp: record.attributes.ApproximateFirstReceiveTimestamp
  });
  
  try {
    Logger.debug('PROCESSOR', 'Parsing message body');
    const message: VoucherGiftMessage = JSON.parse(record.body);
    
    Logger.info('PROCESSOR', `Processing voucher gift: ${message.voucherId}`, {
      voucherId: message.voucherId,
      messageId,
      recipientType: message.recipientEmail ? 'email' : 'wallet',
      amount: message.amount
    });

    if (Math.random() < 0.1) {
      const errorTypes = ['ConnectionError', 'TimeoutError', 'ValidationError'];
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      Logger.debug('PROCESSOR', 'Simulating random error for testing', { errorType: randomError });
      throw new Error(randomError);
    }

    if (message.recipientEmail) {
      Logger.info('PROCESSOR', `Sending voucher gift email to ${message.recipientEmail}`, {
        voucherId: message.voucherId,
        recipientEmail: message.recipientEmail,
        amount: message.amount,
        hasMessage: !!message.message
      });
      
      Logger.debug('PROCESSOR', 'Email would be sent with the following details', {
        to: message.recipientEmail,
        subject: 'You received a voucher gift!',
        amount: message.amount,
        message: message.message || '(No message provided)'
      });
      
    } else if (message.walletAddress) {
      Logger.info('PROCESSOR', `Sending voucher gift to wallet ${message.walletAddress}`, {
        voucherId: message.voucherId,
        walletAddress: message.walletAddress,
        amount: message.amount,
        hasMessage: !!message.message
      });
      
      Logger.debug('PROCESSOR', 'Blockchain transaction would be initiated with details', {
        toAddress: message.walletAddress,
        amount: message.amount,
        memo: message.message || '(No message provided)'
      });
    }

    Logger.debug('PROCESSOR', `Updating voucher ${message.voucherId} status to SENT`);
    const updatedVoucher = await DynamoDBService.updateVoucherStatus(message.voucherId, 'SENT');
    
    if (updatedVoucher) {
      Logger.info('PROCESSOR', `Voucher gift ${message.voucherId} processed successfully`, {
        voucherId: message.voucherId,
        status: 'SENT',
        processingTime: Date.now() - startTime
      });
    } else {
      Logger.warn('PROCESSOR', `Voucher ${message.voucherId} not found when updating status`, {
        voucherId: message.voucherId
      });
    }
    
    metrics.processedCount++;
    metrics.processingTimeMs += (Date.now() - startTime);
    metrics.lastProcessedAt = new Date().toISOString();
    
    logMetrics('success');
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    metrics.failedCount++;
    metrics.lastFailedAt = new Date().toISOString();
    metrics.lastErrorMessage = error.message;
    
    Logger.error('PROCESSOR', `Error processing voucher gift (${processingTime}ms)`, error);
    
    const shouldRetry = RETRY_ERRORS.some(retryError => error.message.includes(retryError));
    const canRetry = receiveCount < MAX_RETRY_COUNT;
    
    Logger.debug('PROCESSOR', 'Retry analysis', {
      shouldRetry,
      canRetry,
      receiveCount,
      maxRetryCount: MAX_RETRY_COUNT,
      errorMessage: error.message
    });
    
    if (shouldRetry && canRetry) {
      Logger.info('PROCESSOR', `Message will be retried, current count: ${receiveCount}`, {
        messageId,
        receiveCount,
        maxRetryCount: MAX_RETRY_COUNT
      });
      metrics.retryCount++;
    } else if (receiveCount >= MAX_RETRY_COUNT) {
      Logger.warn('PROCESSOR', `Message exceeded max retries, sending to DLQ`, {
        messageId,
        receiveCount,
        maxRetryCount: MAX_RETRY_COUNT
      });
      metrics.dlqCount++;
    }
    
    if (record.body) {
      try {
        const message: VoucherGiftMessage = JSON.parse(record.body);
        if (message.voucherId) {
          if (receiveCount >= MAX_RETRY_COUNT) {
            Logger.info('PROCESSOR', `Updating voucher ${message.voucherId} status to FAILED after max retries`);
            await DynamoDBService.updateVoucherStatus(message.voucherId, 'FAILED');
            Logger.info('PROCESSOR', `Updated voucher ${message.voucherId} status to FAILED after max retries`);
          } else if (shouldRetry) {
            // We could add a 'RETRYING' status if needed
            Logger.info('PROCESSOR', `Voucher ${message.voucherId} will be retried`, {
              voucherId: message.voucherId,
              receiveCount,
              maxRetryCount: MAX_RETRY_COUNT
            });
          } else {
            Logger.info('PROCESSOR', `Updating voucher ${message.voucherId} status to FAILED due to non-retryable error`);
            await DynamoDBService.updateVoucherStatus(message.voucherId, 'FAILED');
            Logger.info('PROCESSOR', `Updated voucher ${message.voucherId} status to FAILED due to non-retryable error`);
          }
        }
      } catch (parseError) {
        Logger.error('PROCESSOR', `Error parsing message body for error handling`, parseError);
      }
    }
    
    logMetrics('failure');
    
    if (shouldRetry && canRetry) {
      Logger.debug('PROCESSOR', 'Rethrowing error to trigger retry');
      throw error;
    }
  }
}

export async function processVoucherGiftHandler(event: SQSEvent): Promise<void> {
  const handlerStart = Date.now();
  Logger.info('HANDLER', `Received ${event.Records.length} records to process`, {
    recordCount: event.Records.length,
    eventSource: event.Records[0]?.eventSource,
    region: event.Records[0]?.awsRegion
  });
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const record of event.Records) {
    try {
      Logger.debug('HANDLER', `Processing record ${record.messageId}`);
      await processRecord(record);
      successCount++;
    } catch (error) {
      failureCount++;
      Logger.error('HANDLER', `Failed to process record ${record.messageId}`, error);
    }
  }
  
  const processingTime = Date.now() - handlerStart;
  Logger.info('HANDLER', `Processing complete in ${processingTime}ms`, {
    recordCount: event.Records.length,
    successCount,
    failureCount,
    processingTime
  });
  
  logMetrics('batch-completion');
}

export async function localProcessVoucherGift(messageBody: string): Promise<void> {
  Logger.info('SIMULATOR', 'Simulating SQS message processing', {
    bodyLength: messageBody.length,
    timestamp: new Date().toISOString()
  });
  
  try {
    const timestamp = Date.now().toString();
    const mockRecord: SQSRecord = {
      messageId: `mock-msg-${Date.now()}`,
      receiptHandle: `mock-receipt-${Date.now()}`,
      body: messageBody,
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: timestamp,
        SenderId: 'local-simulator',
        ApproximateFirstReceiveTimestamp: timestamp
      },
      messageAttributes: {},
      md5OfBody: 'mock-md5',
      eventSource: 'local:sqs',
      eventSourceARN: 'mock-arn:local',
      awsRegion: 'local'
    };
    
    Logger.debug('SIMULATOR', 'Created mock SQS record', {
      messageId: mockRecord.messageId,
      timestamp
    });
    
    await processRecord(mockRecord);
    
    Logger.info('SIMULATOR', 'Successfully processed simulated message');
  } catch (error) {
    Logger.error('SIMULATOR', 'Error processing simulated message', error);
    throw error;
  }
}
