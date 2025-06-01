import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
const localConfig = {
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
};

const dynamoClient = new DynamoDBClient(process.env.NODE_ENV === 'production' ? undefined : localConfig);
export const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoClient);
export const sqsClient = new SQSClient(process.env.NODE_ENV === 'production' ? undefined : localConfig);

export const GIFT_VOUCHER_QUEUE_URL =
    process.env.GIFT_VOUCHER_QUEUE_URL || 'http://localhost:4566/000000000000/gift-voucher-queue';

export const VOUCHERS_TABLE_NAME = process.env.VOUCHERS_TABLE_NAME || 'Vouchers';
