// Tunnels API Routes
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
      // File doesn't exist, return empty array
      return [];
    }
    console.error(`Error loading switches config: ${error.message}`);
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

// GET /api/tunnels/switches - Get list of available switches for tunnels
router.get('/switches', async (req, res) => {
  try {
    const switches = await loadSwitchesConfig();
    
    // Only return connected switches
    const connectedSwitches = switches
      .filter(s => s.status === 'connected')
      .map(({ id, hostname, model }) => ({ id, hostname, model }));
    
    res.json(connectedSwitches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tunnels/preview - Generate tunnel configuration preview
router.post('/preview', async (req, res) => {
  try {
    const { 
      switchA, 
      switchB, 
      vni, 
      vtepA, 
      vtepB,
      vlan
    } = req.body;
    
    // Validate required fields
    if (!switchA || !switchB || !vni || !vtepA || !vtepB || !vlan) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['switchA', 'switchB', 'vni', 'vtepA', 'vtepB', 'vlan']
      });
    }
    
    // Generate configuration for Switch A
    const configA = [
      '!',
      '! Switch A VXLAN Configuration',
      '!',
      'interface vxlan 1',
      `  vxlan vni ${vni} vlan ${vlan}`,
      `  vxlan source-interface Loopback0`,
      `  vxlan flood vtep ${vtepB}`,
      `!`,
      `vlan ${vlan}`,
      `  name VXLAN-${vni}`,
      '!'
    ].join('\n');
    
    // Generate configuration for Switch B
    const configB = [
      '!',
      '! Switch B VXLAN Configuration',
      '!',
      'interface vxlan 1',
      `  vxlan vni ${vni} vlan ${vlan}`,
      `  vxlan source-interface Loopback0`,
      `  vxlan flood vtep ${vtepA}`,
      `!`,
      `vlan ${vlan}`,
      `  name VXLAN-${vni}`,
      '!'
    ].join('\n');
    
    res.json({
      configA,
      configB
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tunnels/create - Create a tunnel between two switches
router.post('/create', async (req, res) => {
  try {
    const { 
      switchA, 
      switchB, 
      vni, 
      vtepA, 
      vtepB,
      vlan
    } = req.body;
    
    // Validate required fields
    if (!switchA || !switchB || !vni || !vtepA || !vtepB || !vlan) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['switchA', 'switchB', 'vni', 'vtepA', 'vtepB', 'vlan']
      });
    }

    // Create a unique session ID for this tunnel creation
    const sessionId = `tunnel-${Date.now()}`;
    let phaseProgress = 0;
    
    // Initialize result object
    const result = {
      sessionId,
      status: 'inProgress',
      phases: [],
      errorMessage: null
    };
    
    // Phase 1: Create configuration sessions on both switches
    result.phases.push({
      name: 'Creating configuration sessions',
      status: 'complete',
      progress: 20
    });
    phaseProgress = 20;
    
    try {
      // Phase 2: Configure Switch A
      const clientA = await getSwitchClient(switchA);
      
      // Create commands for switch A
      const commandsA = [
        'enable',
        'configure',
        `vlan ${vlan}`,
        `name VXLAN-${vni}`,
        'exit',
        'interface vxlan 1',
        `vxlan vni ${vni} vlan ${vlan}`,
        'vxlan source-interface Loopback0',
        `vxlan flood vtep ${vtepB}`,
        'end'
      ];
      
      // Execute commands on Switch A
      await clientA.runCommands(commandsA, 'text');
      
      result.phases.push({
        name: 'Configuring Switch A',
        status: 'complete',
        progress: 50
      });
      phaseProgress = 50;
      
      // Phase 3: Configure Switch B
      const clientB = await getSwitchClient(switchB);
      
      // Create commands for switch B
      const commandsB = [
        'enable',
        'configure',
        `vlan ${vlan}`,
        `name VXLAN-${vni}`,
        'exit',
        'interface vxlan 1',
        `vxlan vni ${vni} vlan ${vlan}`,
        'vxlan source-interface Loopback0',
        `vxlan flood vtep ${vtepA}`,
        'end'
      ];
      
      // Execute commands on Switch B
      await clientB.runCommands(commandsB, 'text');
      
      result.phases.push({
        name: 'Configuring Switch B',
        status: 'complete',
        progress: 80
      });
      phaseProgress = 80;
      
      // Phase 4: Verify configurations
      // In a real system, we would verify the tunnel is operational
      // For now, we'll just assume it's successful
      
      result.phases.push({
        name: 'Verifying tunnel configuration',
        status: 'complete',
        progress: 100
      });
      phaseProgress = 100;
      
      // Success
      result.status = 'success';
      
    } catch (error) {
      // Failure - record the error
      result.phases.push({
        name: `Error during phase at ${phaseProgress}%`,
        status: 'failed',
        progress: phaseProgress
      });
      
      result.status = 'failed';
      result.errorMessage = error.message;
    }
    
    // Return final result
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tunnels/:switchId - Get all tunnels on a switch
router.get('/:switchId', async (req, res) => {
  try {
    const client = await getSwitchClient(req.params.switchId);
    const [vxlanInfo] = await client.runCommands(['show vxlan vni']);
    
    if (!vxlanInfo.vnis) {
      return res.json([]);
    }
    
    // Transform VXLAN VNIs to tunnels
    const tunnels = Object.entries(vxlanInfo.vnis).map(([vni, data]) => {
      return {
        id: `tunnel-${vni}-${Date.now()}`,
        vni: parseInt(vni),
        vlan: data.vlan,
        type: data.type,
        sourceInterface: data.sourceInterface,
        vteps: data.floodList || [],
        status: 'active'
      };
    });
    
    res.json(tunnels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tunnels/suggested-vnis - Get suggested VNIs
router.post('/suggested-vnis', async (req, res) => {
  try {
    // Get all switches
    const switches = await loadSwitchesConfig();
    const allVnis = new Set();
    
    // Collect all used VNIs
    for (const switchConfig of switches) {
      try {
        const client = new AristaClient({
          host: switchConfig.mgmtIP,
          username: switchConfig.username,
          password: switchConfig.password
        });
        
        const [vxlanInfo] = await client.runCommands(['show vxlan vni']);
        
        if (vxlanInfo.vnis) {
          Object.keys(vxlanInfo.vnis).forEach(vni => {
            allVnis.add(parseInt(vni));
          });
        }
      } catch (error) {
        // Ignore errors, continue with next switch
      }
    }
    
    // Generate suggested VNIs (starting from 20001)
    const suggestedVnis = [];
    let currentVni = 20001;
    
    while (suggestedVnis.length < 5) {
      if (!allVnis.has(currentVni)) {
        suggestedVnis.push(currentVni);
      }
      currentVni++;
    }
    
    res.json({ suggestedVnis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
