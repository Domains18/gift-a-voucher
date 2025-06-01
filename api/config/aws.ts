import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';

// For local development, we'll use a local configuration
// In production, these would be properly configured with AWS credentials
const localConfig = {
  region: 'us-east-1',
  endpoint: 'http://localhost:4566', // LocalStack endpoint
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
};

// Initialize DynamoDB clients
const dynamoClient = new DynamoDBClient(
  process.env.NODE_ENV === 'production' ? undefined : localConfig
);
export const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize SQS client
export const sqsClient = new SQSClient(
  process.env.NODE_ENV === 'production' ? undefined : localConfig
);

// Define SQS queue URL
export const GIFT_VOUCHER_QUEUE_URL = process.env.GIFT_VOUCHER_QUEUE_URL || 
  'http://localhost:4566/000000000000/gift-voucher-queue';

// Define DynamoDB table name
export const VOUCHERS_TABLE_NAME = process.env.VOUCHERS_TABLE_NAME || 'Vouchers';
