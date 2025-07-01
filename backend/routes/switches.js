// Switches API Routes
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import AristaClient from '../lib/arista-client.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SWITCHES_CONFIG_PATH = process.env.SWITCHES_CONFIG || path.join(__dirname, '..', '..', 'config', 'switches.json');

/**
 * Load saved switch configurations
 * @returns {Promise<Array>} - Array of saved switches
 */
async function loadSwitchesConfig() {
  try {
    const data = await fs.readFile(SWITCHES_CONFIG_PATH, 'utf8');
    const config = JSON.parse(data);
    return config.switches || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with empty array
      await fs.mkdir(path.dirname(SWITCHES_CONFIG_PATH), { recursive: true });
      await fs.writeFile(SWITCHES_CONFIG_PATH, JSON.stringify({ switches: [] }, null, 2));
      return [];
    }
    console.error(`Error loading switches config: ${error.message}`);
    throw error;
  }
}

/**
 * Save switch configurations
 * @param {Array} switches - Array of switches to save
 * @returns {Promise<void>}
 */
async function saveSwitchesConfig(switches) {
  try {
    await fs.mkdir(path.dirname(SWITCHES_CONFIG_PATH), { recursive: true });
    await fs.writeFile(SWITCHES_CONFIG_PATH, JSON.stringify({ switches }, null, 2));
  } catch (error) {
    console.error(`Error saving switches config: ${error.message}`);
    throw error;
  }
}

/**
 * Get a client for a specific switch by ID
 * @param {string} switchId - ID of the switch to get a client for
 * @returns {Promise<AristaClient>} - Arista eAPI client
 */
async function getSwitchClient(switchId) {
  const switches = await loadSwitchesConfig();
  const switchConfig = switches.find(s => s.id === switchId);
  
  if (!switchConfig) {
    throw new Error(`Switch with ID ${switchId} not found`);
  }
  
  return new AristaClient({
    host: switchConfig.mgmtIP,
    username: switchConfig.username,
    password: switchConfig.password
  });
}

// GET /api/switches - Get all switches
router.get('/', async (req, res) => {
  try {
    const switches = await loadSwitchesConfig();
    
    // Filter out password before sending response
    const safeSwitches = switches.map(({ password, ...safe }) => ({
      ...safe,
      // Keep password field but mask it for frontend display
      password: '********'
    }));
    
    res.json(safeSwitches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/switches/:id - Get specific switch
router.get('/:id', async (req, res) => {
  try {
    const switches = await loadSwitchesConfig();
    const switchData = switches.find(s => s.id === req.params.id);
    
    if (!switchData) {
      return res.status(404).json({ error: 'Switch not found' });
    }
    
    // Filter out password before sending response
    const { password, ...safeSwitchData } = switchData;
    
    res.json({
      ...safeSwitchData,
      // Keep password field but mask it for frontend display
      password: '********'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/switches - Add a new switch
router.post('/', async (req, res) => {
  try {
    const { hostname, mgmtIP, username, password, model } = req.body;
    
    // Validate required fields
    if (!hostname || !mgmtIP || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create a client to test connection
    const client = new AristaClient({
      host: mgmtIP,
      username,
      password
    });
    
    // Test connection to the switch
    const connectionTest = await client.testConnection();
    
    if (!connectionTest.connected) {
      return res.status(400).json({ 
        error: 'Failed to connect to switch', 
        details: connectionTest.error 
      });
    }
    
    // Generate unique ID for the switch
    const newSwitch = {
      id: `switch-${Date.now()}`,
      hostname,
      mgmtIP,
      username,
      password,
      model: connectionTest.model || model,
      eosVersion: connectionTest.eosVersion,
      uptime: connectionTest.uptime,
      status: 'connected'
    };
    
    // Load existing switches
    const switches = await loadSwitchesConfig();
    
    // Add new switch
    switches.push(newSwitch);
    
    // Save updated config
    await saveSwitchesConfig(switches);
    
    // Filter out password before sending response
    const { password: _, ...safeSwitchData } = newSwitch;
    
    res.status(201).json({
      ...safeSwitchData,
      // Keep password field but mask it for frontend display
      password: '********'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/switches/:id - Update switch
router.put('/:id', async (req, res) => {
  try {
    const { hostname, mgmtIP, username, password, status } = req.body;
    const switchId = req.params.id;
    
    // Load existing switches
    const switches = await loadSwitchesConfig();
    const switchIndex = switches.findIndex(s => s.id === switchId);
    
    if (switchIndex === -1) {
      return res.status(404).json({ error: 'Switch not found' });
    }
    
    // Update switch data
    switches[switchIndex] = {
      ...switches[switchIndex],
      ...(hostname && { hostname }),
      ...(mgmtIP && { mgmtIP }),
      ...(username && { username }),
      ...(password && { password }),
      ...(status && { status })
    };
    
    // Save updated config
    await saveSwitchesConfig(switches);
    
    // Filter out password before sending response
    const { password: _, ...safeSwitchData } = switches[switchIndex];
    
    res.json({
      ...safeSwitchData,
      // Keep password field but mask it for frontend display
      password: '********'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/switches/:id - Delete switch
router.delete('/:id', async (req, res) => {
  try {
    const switchId = req.params.id;
    
    // Load existing switches
    const switches = await loadSwitchesConfig();
    const filteredSwitches = switches.filter(s => s.id !== switchId);
    
    if (filteredSwitches.length === switches.length) {
      return res.status(404).json({ error: 'Switch not found' });
    }
    
    // Save updated config
    await saveSwitchesConfig(filteredSwitches);
    
    res.json({ success: true, id: switchId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/switches/:id/info - Get detailed switch info
router.get('/:id/info', async (req, res) => {
  try {
    const client = await getSwitchClient(req.params.id);
    const switchInfo = await client.getSwitchInfo();
    
    res.json(switchInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
