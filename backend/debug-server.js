// Minimal Express server to debug path-to-regexp error
import express from 'express';
import cors from 'cors';

// Initialize Express with minimal config
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002;
const apiRouter = express.Router();

// Mount API router
app.use('/api', apiRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Import and mount switches router
import switchesRouter from './routes/switches.js';
apiRouter.use('/switches', switchesRouter);

// Import and mount VLANs router
import vlansRouter from './routes/vlans.js';
apiRouter.use('/vlans', vlansRouter);

// Import and mount VXLANs router
import vxlansRouter from './routes/vxlans.js';
apiRouter.use('/vxlans', vxlansRouter);

// Import and mount tunnels router
import tunnelsRouter from './routes/tunnels.js';
apiRouter.use('/tunnels', tunnelsRouter);

console.log('Added all routers (switches, VLANs, VXLANs, and tunnels)');

// Start the server
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});
