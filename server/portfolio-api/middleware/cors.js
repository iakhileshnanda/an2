const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://akhileshnanda.com',
  'https://www.akhileshnanda.com',
  'https://maya-ai.dev',
  'https://www.maya-ai.dev',
  'https://akhileshnanda.maya-ai.dev',
  'https://v2.akhileshnanda.maya-ai.dev',
  'http://129.158.43.207',
  'https://129.158.43.207',
  process.env.ALLOWED_ORIGIN,
].filter(Boolean);

module.exports = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
