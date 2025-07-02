// Test server to debug path-to-regexp errors
import express from 'express';
import cors from 'cors';

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const apiRouter = express.Router();

// Basic test route
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount routers individually to test which one causes issues
app.use('/api', apiRouter);

// Test each router individually
import switchesRouter from './routes/switches.js';
apiRouter.use('/switches', switchesRouter);

// VLANs router
import vlansRouter from './routes/vlans.js';
apiRouter.use('/vlans', vlansRouter);

// VXLANs router
import vxlansRouter from './routes/vxlans.js';
apiRouter.use('/vxlans', vxlansRouter);

// Tunnels router
import tunnelsRouter from './routes/tunnels.js';
apiRouter.use('/tunnels', tunnelsRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
