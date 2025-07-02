// Arista Switch Manager API Server - HTTP only for lab use
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
const PORT = process.env.PORT || 3001; // Using 3001 to avoid permission issues with port 80
const SWITCHES_CONFIG_PATH = process.env.SWITCHES_CONFIG || path.join(__dirname, '..', 'config', 'switches.json');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Initialize Express with minimal configuration
const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API router
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
  res.status(200).json({ 
    status: 'running',
    message: 'Arista Switch Manager API is operational',
    version: '1.0.0'
  });
});

// Register API router modules
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

// Serve static files from build directory after API routes are registered
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir));

// SPA fallback - Using middleware approach instead of wildcard route to avoid path-to-regexp errors
app.use((req, res, next) => {
  // Only handle non-API routes for SPA fallback
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(staticDir, 'index.html'));
  } else {
    next();
  }
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

// Start the server - explicitly listen on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Arista Switch Manager API running on port ${PORT}`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
  console.log('Server bound to all network interfaces');
});

// Utility function to ensure config directory exists
async function ensureConfigDirectory() {
  try {
    const configDir = path.dirname(SWITCHES_CONFIG_PATH);
    await fs.promises.mkdir(configDir, { recursive: true });
    
    // Check if config file exists
    try {
      await fs.promises.access(SWITCHES_CONFIG_PATH);
    } catch (error) {
      // Create empty config if it doesn't exist
      await fs.promises.writeFile(
        SWITCHES_CONFIG_PATH, 
        JSON.stringify({ switches: [] }, null, 2)
      );
    }
  } catch (error) {
    console.error(`Error initializing config: ${error.message}`);
  }
}

// Initialize configuration
ensureConfigDirectory();

// Log successful startup without path-to-regexp errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at Promise:', promise, 'reason:', reason);
});
