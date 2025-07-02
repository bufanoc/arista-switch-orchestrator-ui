// Minimal Express API server - HTTP only
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ES Module file path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// API router
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Import router modules
import switchesRouter from './routes/switches.js';
import vlansRouter from './routes/vlans.js';
import vxlansRouter from './routes/vxlans.js';
import tunnelsRouter from './routes/tunnels.js';

// Register API routes
apiRouter.use('/switches', switchesRouter);
apiRouter.use('/vlans', vlansRouter);
apiRouter.use('/vxlans', vxlansRouter);
apiRouter.use('/tunnels', tunnelsRouter);

// Static file serving
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir));

// Simple SPA fallback - no wildcard or regex
app.use((req, res) => {
  // Only handle non-API routes for SPA fallback
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(staticDir, 'index.html'));
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
