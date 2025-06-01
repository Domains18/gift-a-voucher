#!/bin/bash

echo "Initializing AWS resources in LocalStack..."

# Create SQS queue
echo "Creating SQS queue: gift-voucher-queue"
awslocal sqs create-queue --queue-name gift-voucher-queue

# Create DynamoDB table
echo "Creating DynamoDB table: Vouchers"
awslocal dynamodb create-table \
    --table-name Vouchers \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5

# List created resources
echo "Created SQS queues:"
awslocal sqs list-queues

echo "Created DynamoDB tables:"
awslocal dynamodb list-tables

echo "AWS resources initialization complete!"
