import express from 'express';
import dotenv from 'dotenv';
import { giftVoucherHandler } from './handlers/giftVoucher';
import { localProcessVoucherGift } from './handlers/processVoucherGift';
import { setupLocalAwsResources } from './utils/localAwsSetup';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup local AWS resources if in development mode
if (process.env.NODE_ENV !== 'production') {
  setupLocalAwsResources()
    .then(() => console.log('Local AWS resources setup complete'))
    .catch(err => console.error('Failed to setup local AWS resources:', err));
}

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Gift voucher endpoint
app.post('/api/vouchers/gift', giftVoucherHandler);

// Simulate SQS message processing (for local development)
app.post('/api/simulate/process-voucher', async (req, res) => {
  try {
    const messageBody = JSON.stringify(req.body);
    await localProcessVoucherGift(messageBody);
    res.status(200).json({ success: true, message: 'Voucher processed successfully' });
  } catch (error) {
    console.error('Error simulating voucher processing:', error);
    res.status(500).json({ success: false, error: 'Failed to process voucher' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/vouchers/gift - Gift a voucher');
  console.log('- POST /api/simulate/process-voucher - Simulate processing a voucher gift');
});
