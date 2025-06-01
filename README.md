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
- Comprehensive Logging on the backend

## Technologies

### Backend

- Node.js with TypeScript
- Express.js for API endpoints
- AWS SDK v3 for SQS and DynamoDB
- Zod for input validation
- Vitest for unit testing
- Serverless architecture (Lambda-style handlers)

### Frontend

- React with TypeScript
- Bootstrap for UI components
- Axios for API requests
- React Testing Library for component tests
- Vitest for unit testing

### Development & DevOps

- Docker and Docker Compose for local AWS emulation
- LocalStack for AWS services emulation
- Concurrently for running multiple services
- Git for version control

## Project Structure

```
gift-a-voucher/
├── api/                      # Backend API
│   ├── config/               # AWS configuration
│   ├── handlers/             # API and Lambda handlers
│   ├── models/               # Data models and validation
│   ├── services/             # Services for SQS and DynamoDB
│   ├── tests/                # Backend unit tests
│   │   ├── handlers/         # Handler tests
│   │   └── services/         # Service tests
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── index.ts              # Main Express server
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # Backend TypeScript config
├── frontend/                 # React frontend
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   └── tests/            # Frontend unit tests
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
├── public/                   # Public assets
├── .env                      # Environment variables
├── docker-compose.yml        # Docker configuration
├── init-aws-resources.sh     # AWS resources setup script
├── package.json              # Root package.json for monorepo
├── start.sh                  # Project startup script
├── tsconfig.json             # TypeScript configuration
└── vitest.config.ts          # Vitest configuration
```

## Setup and Installation

### Option 1: Using the Start Script (Recommended)

The easiest way to set up and run the project is using the provided start script:

```bash
./start.sh
```

This script will:

1. Install all dependencies for both backend and frontend
2. Start LocalStack using Docker Compose
3. Initialize AWS resources (SQS queue and DynamoDB table)
4. Start both the API and frontend concurrently

### Option 2: Manual Setup

1. Install root dependencies:

    ```bash
    npm install
    ```

2. Install API and frontend dependencies:

    ```bash
    cd api && npm install
    cd ../frontend && npm install
    cd ..
    ```

3. Start LocalStack using Docker Compose:

    ```bash
    npm run docker:up
    ```

4. Initialize AWS resources:

    ```bash
    ./init-aws-resources.sh
    ```

5. Start the backend and frontend:

    ```bash
    # Start both concurrently
    npm run dev:all

    # Or start them individually
    npm run dev:api     # Backend only
    npm run dev:frontend # Frontend only
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

## Testing

The project includes comprehensive test suites for both the backend and frontend using Vitest.

### Running Tests

From the root directory, you can run all tests:

```bash
npm test
```

Or run tests for specific parts of the application:

```bash
# Backend tests only
npm run test:api

# Frontend tests only
npm run test:frontend
```

### Test Coverage

To generate test coverage reports:

```bash
npm run test:coverage
```

### Backend Tests

Backend tests cover:

- DynamoDB service operations (save, get, update voucher records)
- SQS service message sending
- Voucher processing logic including retry and DLQ handling
- API handlers for voucher gifting

### Frontend Tests

Frontend tests cover:

- React components (VoucherForm)
- API service module
- Form validation and submission
- Success/error modals

## Error Handling

The API includes validation and error handling for:

- Missing required fields
- Invalid email format
- Non-positive amount values
- AWS service errors
- Retry logic for transient failures
- Dead-letter queue (DLQ) for persistent failures

## Monitoring

The application includes monitoring capabilities:

- Structured logging with [MONITOR] and [METRICS] prefixes
- Tracking of processed, failed, retried, and DLQ messages
- Processing time measurements

## Deployment

For production deployment, configure the appropriate AWS credentials and environment variables for your serverless environment. The application is designed to work with AWS Lambda, SQS, and DynamoDB.
