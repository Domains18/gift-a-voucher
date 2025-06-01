import { CreateQueueCommand } from '@aws-sdk/client-sqs';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { sqsClient, dynamoDbDocClient, GIFT_VOUCHER_QUEUE_URL, VOUCHERS_TABLE_NAME } from '../config/aws';

export async function setupLocalAwsResources(): Promise<void> {
  try {
    try {
      console.log('Creating SQS queue...');
      const createQueueCommand = new CreateQueueCommand({
        QueueName: 'gift-voucher-queue',
      });
      await sqsClient.send(createQueueCommand);
      console.log(`SQS queue created: ${GIFT_VOUCHER_QUEUE_URL}`);
    } catch (error: any) {
      if (error.name === 'QueueAlreadyExists') {
        console.log('SQS queue already exists');
      } else {
        throw error;
      }
    }

    try {
      console.log('Creating DynamoDB table...');
      const createTableCommand = new CreateTableCommand({
        TableName: VOUCHERS_TABLE_NAME,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      });
      await dynamoDbDocClient.send(createTableCommand);
      console.log(`DynamoDB table created: ${VOUCHERS_TABLE_NAME}`);
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log('DynamoDB table already exists');
      } else {
        throw error;
      }
    }

    console.log('Local AWS resources setup complete');
  } catch (error) {
    console.error('Error setting up local AWS resources:', error);
    throw error;
  }
}
