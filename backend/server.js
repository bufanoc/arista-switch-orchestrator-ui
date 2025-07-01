// Arista Switch Manager API Server
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// ES Module file path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 80;
const SWITCHES_CONFIG_PATH = process.env.SWITCHES_CONFIG || path.join(__dirname, '..', 'config', 'switches.json');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  if (LOG_LEVEL === 'debug') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'running',
    message: 'Arista Switch Manager API is operational',
    version: '1.0.0'
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Switches API endpoints
import switchesRouter from './routes/switches.js';
apiRouter.use('/switches', switchesRouter);

// VLANs API endpoints
import vlansRouter from './routes/vlans.js';
apiRouter.use('/vlans', vlansRouter);

// VXLANs API endpoints
import vxlansRouter from './routes/vxlans.js';
apiRouter.use('/vxlans', vxlansRouter);

// Tunnels API endpoints
import tunnelsRouter from './routes/tunnels.js';
apiRouter.use('/tunnels', tunnelsRouter);

// Serve static files from build directory
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir));

// SPA fallback - Serve index.html for any route not matched by API or static files
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Arista Switch Manager API server running on port ${PORT}`);
});

// Utility function to ensure config directory exists
function ensureConfigDirectory() {
  const configDir = path.dirname(SWITCHES_CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Create empty switches.json if it doesn't exist
  if (!fs.existsSync(SWITCHES_CONFIG_PATH)) {
    fs.writeFileSync(SWITCHES_CONFIG_PATH, JSON.stringify({ switches: [] }, null, 2));
    console.log(`Created empty switches configuration at ${SWITCHES_CONFIG_PATH}`);
  }
}

// Initialize configuration
ensureConfigDirectory();
