import express from 'express';
import dotenv from 'dotenv';
import { giftVoucherHandler } from './handlers/giftVoucher';
import { localProcessVoucherGift } from './handlers/processVoucherGift';
import { setupLocalAwsResources } from './utils/localAwsSetup';
import cors from 'cors';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

Logger.info('SERVER', 'Starting Gift-a-Voucher API service');
Logger.info('SERVER', `Environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));
Logger.info('SERVER', 'CORS configured with open access for development');

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  Logger.info('REQUEST', `${req.method} ${req.url}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
  });
  
  // Log request body if it exists and isn't a file upload
  if (req.body && req.get('content-type')?.includes('application/json')) {
    Logger.debug('REQUEST', 'Request body:', req.body);
  }
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - start;
    Logger.info('RESPONSE', `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`, {
      requestId,
      statusCode: res.statusCode,
      responseTime,
    });
    
    return originalSend.call(this, body);
  };
  
  next();
});

if (process.env.NODE_ENV !== 'production') {
  Logger.info('SERVER', 'Setting up local AWS resources for development');
  setupLocalAwsResources()
    .then(() => Logger.info('SERVER', 'Local AWS resources setup complete'))
    .catch(err => Logger.error('SERVER', 'Failed to setup local AWS resources', err));
}

// Parse JSON request bodies
app.use(express.json());
Logger.debug('SERVER', 'JSON body parser configured');

// Serve static files
app.use(express.static('public'));
Logger.debug('SERVER', 'Static file serving configured for directory: public');

// Health check endpoint
app.get('/health', (req, res) => {
  Logger.info('HEALTH', 'Health check requested');
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Gift voucher endpoint
app.post('/api/vouchers/gift', (req, res) => {
  Logger.info('API', 'Gift voucher request received');
  return giftVoucherHandler(req, res);
});

// Simulate voucher processing endpoint
app.post('/api/simulate/process-voucher', async (req, res) => {
  Logger.info('API', 'Simulate process voucher request received');
  
  try {
    const messageBody = JSON.stringify(req.body);
    Logger.debug('API', 'Processing voucher with data:', req.body);
    
    await localProcessVoucherGift(messageBody);
    
    Logger.info('API', 'Voucher processed successfully');
    res.status(200).json({ success: true, message: 'Voucher processed successfully' });
  } catch (error) {
    Logger.error('API', 'Error simulating voucher processing', error);
    res.status(500).json({ success: false, error: 'Failed to process voucher' });
  }
});

// Start the server
app.listen(PORT, () => {
  Logger.info('SERVER', `Server running on port ${PORT}`);
  Logger.info('SERVER', 'Available endpoints:');
  Logger.info('SERVER', '- POST /api/vouchers/gift - Gift a voucher');
  Logger.info('SERVER', '- POST /api/simulate/process-voucher - Simulate processing a voucher gift');
  Logger.info('SERVER', '- GET /health - Health check endpoint');
  
  // Log server configuration
  Logger.debug('SERVER', 'Server configuration', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    vouchersTable: process.env.VOUCHERS_TABLE_NAME,
    queueUrl: process.env.GIFT_VOUCHER_QUEUE_URL
  });
});
