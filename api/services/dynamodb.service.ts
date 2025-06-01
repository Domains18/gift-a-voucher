import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbDocClient, VOUCHERS_TABLE_NAME } from '../config/aws';
import { VoucherGift } from '../models/voucher';
import { Logger } from '../utils/logger';

export class DynamoDBService {
    static async saveVoucherGift(voucher: VoucherGift): Promise<VoucherGift> {
        const startTime = Date.now();
        Logger.info('DYNAMODB', `Saving voucher to DynamoDB: ${voucher.id}`, {
            operation: 'saveVoucherGift',
            voucherId: voucher.id,
            tableName: VOUCHERS_TABLE_NAME,
        });

        try {
            Logger.debug('DYNAMODB', 'Creating PutCommand for voucher', {
                voucherId: voucher.id,
                recipientType: voucher.recipientEmail ? 'email' : 'wallet',
                status: voucher.status,
            });

            const command = new PutCommand({
                TableName: VOUCHERS_TABLE_NAME,
                Item: voucher,
            });

            const result = await dynamoDbDocClient.send(command);
            const duration = Date.now() - startTime;

            Logger.info('DYNAMODB', `Successfully saved voucher ${voucher.id} in ${duration}ms`, {
                operation: 'saveVoucherGift',
                voucherId: voucher.id,
                duration,
                consumedCapacity: result.ConsumedCapacity,
            });

            return voucher;
        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.error('DYNAMODB', `Error saving voucher to DynamoDB (${duration}ms)`, error);

            if (error instanceof Error) {
                Logger.debug('ERROR_DETAILS', 'DynamoDB error details', {
                    operation: 'saveVoucherGift',
                    voucherId: voucher.id,
                    errorName: error.name,
                    errorMessage: error.message,
                    duration,
                });
            }

            throw new Error('Failed to save voucher gift');
        }
    }

    static async getVoucherGift(id: string): Promise<VoucherGift | null> {
        const startTime = Date.now();
        Logger.info('DYNAMODB', `Retrieving voucher from DynamoDB: ${id}`, {
            operation: 'getVoucherGift',
            voucherId: id,
            tableName: VOUCHERS_TABLE_NAME,
        });

        try {
            const command = new GetCommand({
                TableName: VOUCHERS_TABLE_NAME,
                Key: { id },
            });

            const response = await dynamoDbDocClient.send(command);
            const duration = Date.now() - startTime;

            if (response.Item) {
                Logger.info('DYNAMODB', `Successfully retrieved voucher ${id} in ${duration}ms`, {
                    operation: 'getVoucherGift',
                    voucherId: id,
                    duration,
                    found: true,
                    consumedCapacity: response.ConsumedCapacity,
                });
                return response.Item as VoucherGift;
            } else {
                Logger.warn('DYNAMODB', `Voucher not found: ${id} (${duration}ms)`, {
                    operation: 'getVoucherGift',
                    voucherId: id,
                    duration,
                    found: false,
                });
                return null;
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.error('DYNAMODB', `Error retrieving voucher from DynamoDB (${duration}ms)`, error);

            if (error instanceof Error) {
                Logger.debug('ERROR_DETAILS', 'DynamoDB error details', {
                    operation: 'getVoucherGift',
                    voucherId: id,
                    errorName: error.name,
                    errorMessage: error.message,
                    duration,
                });
            }

            throw new Error('Failed to retrieve voucher gift');
        }
    }

    static async updateVoucherStatus(id: string, status: 'PENDING' | 'SENT' | 'FAILED'): Promise<VoucherGift | null> {
        const startTime = Date.now();
        Logger.info('DYNAMODB', `Updating voucher status: ${id} -> ${status}`, {
            operation: 'updateVoucherStatus',
            voucherId: id,
            newStatus: status,
            tableName: VOUCHERS_TABLE_NAME,
        });

        try {
            Logger.debug('DYNAMODB', `Retrieving current voucher data for update: ${id}`);
            const voucher = await this.getVoucherGift(id);

            if (!voucher) {
                Logger.warn('DYNAMODB', `Cannot update status: Voucher not found: ${id}`, {
                    operation: 'updateVoucherStatus',
                    voucherId: id,
                    requestedStatus: status,
                });
                return null;
            }

            Logger.debug('DYNAMODB', `Current voucher status: ${voucher.status}, updating to: ${status}`, {
                operation: 'updateVoucherStatus',
                voucherId: id,
                currentStatus: voucher.status,
                newStatus: status,
            });

            const updatedVoucher: VoucherGift = {
                ...voucher,
                status,
            };

            const command = new PutCommand({
                TableName: VOUCHERS_TABLE_NAME,
                Item: updatedVoucher,
            });

            const result = await dynamoDbDocClient.send(command);
            const duration = Date.now() - startTime;

            Logger.info('DYNAMODB', `Successfully updated voucher ${id} status to ${status} in ${duration}ms`, {
                operation: 'updateVoucherStatus',
                voucherId: id,
                oldStatus: voucher.status,
                newStatus: status,
                duration,
                consumedCapacity: result.ConsumedCapacity,
            });

            return updatedVoucher;
        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.error('DYNAMODB', `Error updating voucher status in DynamoDB (${duration}ms)`, error);

            if (error instanceof Error) {
                Logger.debug('ERROR_DETAILS', 'DynamoDB error details', {
                    operation: 'updateVoucherStatus',
                    voucherId: id,
                    requestedStatus: status,
                    errorName: error.name,
                    errorMessage: error.message,
                    duration,
                });
            }

            throw new Error('Failed to update voucher status');
        }
    }
}
