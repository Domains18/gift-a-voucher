#!/bin/bash

echo "Setting up Gift a Voucher project..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing root dependencies..."
  npm install
  
  echo "Installing API dependencies..."
  cd api && npm install && cd ..
  
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Start LocalStack
echo "Starting LocalStack..."
docker compose up -d

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
sleep 10

# Run initialization script
echo "Initializing AWS resources..."
chmod +x ./init-aws-resources.sh
./init-aws-resources.sh

# Start both services using concurrently
echo "Starting API and frontend..."
npm run dev:all
