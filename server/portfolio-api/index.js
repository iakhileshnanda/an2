require('dotenv').config();
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./middleware/cors');
const { apiLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const { initWs } = require('./realtime');

const statsRoute = require('./routes/stats');
const jobsRoute = require('./routes/jobs');
const resumeRoute = require('./routes/resume');
const contactRoute = require('./routes/contact');
const mayaRoute = require('./routes/maya');
const aboutRoute = require('./routes/about');
const recruiterChatRoute = require('./routes/recruiterChat');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const STARTED_AT = Date.now();

// Security
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' }));

// Health check — no rate limit
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
    modes: ['lab', 'portfolio'],
  });
});

// Routes with rate limiting
app.use('/api', apiLimiter);
app.use('/api/maya', mayaRoute);
app.use('/api/stats', statsRoute);
app.use('/api/jobs', jobsRoute);
app.use('/api/resume', resumeRoute);
app.use('/api/contact', contactRoute);
app.use('/api/recruiter-chat', recruiterChatRoute);
// about + admin update routes register at /api/about and /api/update
app.use('/api', aboutRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const server = http.createServer(app);
initWs(server); // attaches the live-dashboard WebSocket at /ws

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════╗
  ║   A.NANDA API — RUNNING      ║
  ║   Port: ${PORT}                  ║
  ║   Env:  ${process.env.NODE_ENV || 'development'}          ║
  ║   WS:   /ws                  ║
  ╚══════════════════════════════╝
  `);
});

module.exports = { app, server };
