import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbDocClient, VOUCHERS_TABLE_NAME } from '../config/aws';
import { VoucherGift } from '../models/voucher';


export class DynamoDBService {

  static async saveVoucherGift(voucher: VoucherGift): Promise<VoucherGift> {
    try {
      const command = new PutCommand({
        TableName: VOUCHERS_TABLE_NAME,
        Item: voucher,
      });

      await dynamoDbDocClient.send(command);
      return voucher;
    } catch (error) {
      console.error('Error saving voucher to DynamoDB:', error);
      throw new Error('Failed to save voucher gift');
    }
  }

  static async getVoucherGift(id: string): Promise<VoucherGift | null> {
    try {
      const command = new GetCommand({
        TableName: VOUCHERS_TABLE_NAME,
        Key: { id },
      });

      const response = await dynamoDbDocClient.send(command);
      return response.Item as VoucherGift || null;
    } catch (error) {
      console.error('Error retrieving voucher from DynamoDB:', error);
      throw new Error('Failed to retrieve voucher gift');
    }
  }


  static async updateVoucherStatus(
    id: string, 
    status: 'PENDING' | 'SENT' | 'FAILED'
  ): Promise<VoucherGift | null> {
    try {
      const voucher = await this.getVoucherGift(id);
      if (!voucher) {
        return null;
      }

      const updatedVoucher: VoucherGift = {
        ...voucher,
        status,
      };

      const command = new PutCommand({
        TableName: VOUCHERS_TABLE_NAME,
        Item: updatedVoucher,
      });

      await dynamoDbDocClient.send(command);
      return updatedVoucher;
    } catch (error) {
      console.error('Error updating voucher status in DynamoDB:', error);
      throw new Error('Failed to update voucher status');
    }
  }
}
