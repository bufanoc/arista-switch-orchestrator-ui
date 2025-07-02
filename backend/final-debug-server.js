// Full debug server - closely matching main server.js but with simplified structure
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ES Module file path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 3003;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Initialize Express with minimal config
const app = express();

// Core middleware first
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Router
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Logging middleware
app.use((req, res, next) => {
  if (LOG_LEVEL === 'debug') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Debug server is running'
  });
});

// Import and mount all routers
import switchesRouter from './routes/switches.js';
import vlansRouter from './routes/vlans.js';
import vxlansRouter from './routes/vxlans.js';
import tunnelsRouter from './routes/tunnels.js';

apiRouter.use('/switches', switchesRouter);
apiRouter.use('/vlans', vlansRouter);
apiRouter.use('/vxlans', vxlansRouter);
apiRouter.use('/tunnels', tunnelsRouter);

console.log('Added all routers in simplified configuration');

// Serve static files - simplified from main server.js
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir));

// SPA fallback - modified to use a more explicit approach
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(staticDir, 'index.html'));
  } else {
    next();
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Final debug server running on port ${PORT}`);
});
