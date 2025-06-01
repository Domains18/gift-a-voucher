# Gift a Voucher Feature

This project implements a "Gift a Voucher" feature for a digital marketplace. Users can gift vouchers to other users via email or wallet address.

## Features

- Gift vouchers to users via email or wallet address
- Validate input data
- Publish messages to AWS SQS queue
- Process messages with a Lambda-style handler
- Store gift records in DynamoDB

## Tech Stack

- Node.js with TypeScript
- Express.js for the API
- AWS SDK for SQS and DynamoDB
- Zod for validation
- Serverless architecture (Lambda-style handlers)

## Project Structure

```
gift-a-voucher/
├── api/
│   ├── config/       # AWS configuration
│   ├── handlers/     # API and Lambda handlers
│   ├── models/       # Data models and validation
│   ├── services/     # Services for SQS and DynamoDB
│   ├── utils/        # Utility functions
│   └── index.ts      # Main Express server
├── .env              # Environment variables
├── nodemon.json      # Nodemon configuration
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   # or
   pnpm install
   ```

2. For local development, you'll need to run a local AWS environment like LocalStack:
   ```
   docker run -d -p 4566:4566 -p 4571:4571 localstack/localstack
   ```

3. Start the development server:
   ```
   npm start
   # or
   pnpm start
   ```

## API Endpoints

### Gift a Voucher
- **URL**: `/api/vouchers/gift`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "recipientEmail": "recipient@example.com", // Optional if walletAddress is provided
    "walletAddress": "0x123...", // Optional if recipientEmail is provided
    "amount": 100,
    "message": "Happy Birthday!" // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "voucher-uuid",
      "status": "PENDING"
    }
  }
  ```

### Simulate Processing a Voucher (for local development)
- **URL**: `/api/simulate/process-voucher`
- **Method**: `POST`
- **Request Body**: Same as the voucher gift message
- **Response**:
  ```json
  {
    "success": true,
    "message": "Voucher processed successfully"
  }
  ```

## Error Handling

The API includes validation and error handling for:
- Missing required fields
- Invalid email format
- Non-positive amount values
- AWS service errors

## Deployment

For production deployment, configure the appropriate AWS credentials and environment variables for your serverless environment.
