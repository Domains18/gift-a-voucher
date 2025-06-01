# Gift a Voucher

A feature for a digital marketplace that allows users to gift vouchers to recipients via email or wallet address. The system uses a queue-based architecture for reliable asynchronous processing with robust retry and error handling.

## Features

- Gift vouchers via email or wallet address
- Asynchronous processing with AWS SQS
- Persistent storage with AWS DynamoDB
- Retry handling and dead-letter queue (DLQ) logic
- Detailed monitoring and metrics
- React frontend with form validation
- Comprehensive test suite using Vitest
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

2. For local development, use Docker Compose to start LocalStack (includes DynamoDB and SQS):
   ```
   docker-compose up -d
   ```
   
   This will automatically set up the required AWS resources (SQS queue and DynamoDB table).

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
