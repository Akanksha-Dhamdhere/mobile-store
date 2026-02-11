require('dotenv').config();
const validateEnvironment = require('./utils/envValidation');
validateEnvironment(); // Validate environment variables on startup

const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');
const adminForgotPassword = require('./routes/adminForgotPassword');



const adminRoutes = require('./routes/admin');

const productRoutes = require('./routes/products');
const accessoryRoutes = require('./routes/accessories');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');

const otpRoutes = require('./routes/otp');
const ordersRoutes = require('./routes/orders');

// New feature routes
const searchRoutes = require('./routes/search');
const recommendationRoutes = require('./routes/recommendations');
const notificationRoutes = require('./routes/notifications');
const inventoryRoutes = require('./routes/inventory');
const activityRoutes = require('./routes/activity');
const newsletterRoutes = require('./routes/newsletter');


const cookieParser = require('cookie-parser');
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://project-grp.vercel.app'
];

// Use the `cors` package with explicit options so preflight requests are handled
// correctly when the frontend sends credentials (cookies or Authorization header).
// This is fairly strict for production but allows common local-dev origins.
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser tools (curl) which send no Origin header
    if (!origin) return callback(null, true);

    // Normalize incoming origin so trailing slashes or minor variations don't cause mismatches
    let normalizedOrigin = origin;
    try {
      normalizedOrigin = new URL(origin).origin; // e.g. 'http://localhost:5000'
    } catch (e) {
      // leave as-is if parsing fails
    }

    // Debug log the incoming origin and the normalized form to make blocked origins easy to identify
    // Enable verbose CORS debug logs by setting DEBUG_CORS=true in the environment
    if (process.env.DEBUG_CORS === 'true') {
      console.log('CORS check origin:', origin, 'normalized:', normalizedOrigin);
    }

    // Exact whitelist match (try normalized form first)
    if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) return callback(null, true);

    // Allow any localhost / 127.0.0.1 host (any port)
    try {
      const hostname = new URL(origin).hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.localhost')
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // ignore URL parse errors
    }

    // During development allow other origins for convenience (remove in prod)
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`CORS: allowing origin ${origin} in development mode`);
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Return a clear JSON response for CORS rejections (instead of a generic 500)
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Origin not allowed by CORS', origin: req.get('origin') });
  }
  next(err);
});
// Ensure OPTIONS preflight uses the same options
app.options('*', cors(corsOptions));

// Optional: log CORS headers for debugging (be explicit when Origin header is absent)
app.use((req, res, next) => {
  res.on('finish', () => {
    if (process.env.DEBUG_CORS !== 'true') return; // keep quiet unless explicitly enabled
    const origin = req.get('origin');
    if (!origin) {
      console.log('CORS Headers: no Origin header present; no Access-Control-Allow-Origin set (expected for same-origin or non-browser requests)');
      return;
    }

    console.log('CORS Headers:', {
      Origin: origin,
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
    });
  });
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use('/api/check-email', require('./routes/checkEmail'));
const reviewsRouter = require('./routes/reviews');
app.use('/api/change-password', require('./routes/changePassword'));



app.use('/api/products', productRoutes);
app.use('/api/clerk-webhook', require('./routes/clerkWebhook'));
app.use('/api/accessories', accessoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/admin-forgot-password', adminForgotPassword);
app.use('/api/users', usersRoutes);
app.use('/api/set-password', require('./routes/setPassword'));
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/bills', require('./routes/bills'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/otp', otpRoutes);

// New feature routes
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/newsletter', newsletterRoutes);

app.use('/api/admin', adminRoutes);


// Email sending route
app.use('/api/send-email', require('./routes/sendEmail'));

const PORT = process.env.PORT || 5000;
app.use('/api/reviews', reviewsRouter);

// Simple health check for quick verification
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Backend healthy' }));

// Fail fast if Mongo URI missing
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Please add MONGO_URI to your .env (e.g. mongodb://localhost:27017/dbname)');
  process.exit(1);
}

// Start server once DB connection established
let serverInstance = null;
const startServer = () => {
  if (serverInstance) return;
  serverInstance = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  serverInstance.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Another process is listening on this port.`);
      console.error('Tip: run `netstat -ano | findstr :' + PORT + '` (Windows) or `lsof -i :' + PORT + '` (macOS/Linux) to find and kill the process, or run `npx kill-port ' + PORT + '`.');
      process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
  });
};

// Connect to MongoDB with retry/backoff to tolerate transient network issues
const mongooseOptions = { useNewUrlParser: true, useUnifiedTopology: true };
const maxRetries = parseInt(process.env.MONGO_CONNECT_MAX_RETRIES || '5', 10);
const initialDelayMs = parseInt(process.env.MONGO_CONNECT_INITIAL_DELAY_MS || '2000', 10);

const connectWithRetry = (retriesLeft = maxRetries, delayMs = initialDelayMs) => {
  console.log(`Attempting MongoDB connection. Retries left: ${retriesLeft}`);
  mongoose.connect(process.env.MONGO_URI, mongooseOptions)
    .then(() => {
      console.log('MongoDB connected');
      startServer();
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err && err.message ? err.message : err);

      // If this is a network timeout / transient error, retry with exponential backoff
      if (retriesLeft > 0) {
        const nextDelay = Math.min(delayMs * 2, 60000); // cap at 60s
        console.log(`Retrying MongoDB connection in ${delayMs}ms...`);
        setTimeout(() => connectWithRetry(retriesLeft - 1, nextDelay), delayMs);
      } else {
        console.error('Exhausted MongoDB connection retries. Please check network access and MONGO_URI.');
        // Keep process alive to allow operator to inspect logs, unless explicitly configured to exit
        if (process.env.EXIT_ON_DB_FAILURE === 'true') {
          process.exit(1);
        }
      }
    });
};

// Kick off connection attempts
connectWithRetry();

// Razorpay instance (only if credentials are present)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('Razorpay keys not found; payment routes will return 503 (service unavailable) until configured.');
}

// Create order API
app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!razorpay) return res.status(503).json({ success: false, message: 'Payment service not configured' });
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });
    res.json(order);
  } catch (err) {
    console.error('Create order error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment API
app.post('/verify-payment', (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ success: false, message: 'Payment service not configured' });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  if (expectedSign === razorpay_signature) {
    res.json({ success: true, message: "Payment verified" });
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

// Global error handler (log errors and send JSON responses)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { error: err.stack || err } : {}),
  });
});

