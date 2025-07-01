// VXLANs API Routes
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

// GET /api/vxlans - Get VXLANs from all switches
router.get('/', async (req, res) => {
  try {
    const switches = await loadSwitchesConfig();
    const allVxlans = [];
    
    // Collect VXLANs from all switches
    for (const switchConfig of switches) {
      try {
        const client = new AristaClient({
          host: switchConfig.mgmtIP,
          username: switchConfig.username,
          password: switchConfig.password
        });
        
        const vxlans = await client.getVxlans();
        
        // Enrich VXLAN data with switch information
        vxlans.forEach(vxlan => {
          const existingVxlanIndex = allVxlans.findIndex(v => v.vni === vxlan.vni);
          
          if (existingVxlanIndex >= 0) {
            // VXLAN already exists, add this switch to its vtep list
            allVxlans[existingVxlanIndex].vtepIps = [
              ...new Set([
                ...allVxlans[existingVxlanIndex].vtepIps,
                ...(vxlan.floodList || [])
              ])
            ];
            
            // Add switch to the list if not already there
            if (!allVxlans[existingVxlanIndex].switches.find(s => s.id === switchConfig.id)) {
              allVxlans[existingVxlanIndex].switches.push({
                id: switchConfig.id,
                hostname: switchConfig.hostname
              });
            }
          } else {
            // New VXLAN, add it to the list
            allVxlans.push({
              id: `vxlan-${vxlan.vni}-${Date.now()}`,
              vni: vxlan.vni,
              name: `VXLAN-${vxlan.vni}`, // Default name if not specified
              vlan: vxlan.vlan,
              vtepIps: vxlan.floodList || [],
              status: 'active',
              tunnelCount: (vxlan.floodList || []).length,
              switches: [{
                id: switchConfig.id,
                hostname: switchConfig.hostname
              }]
            });
          }
        });
      } catch (error) {
        console.error(`Error fetching VXLANs from ${switchConfig.hostname}: ${error.message}`);
        // Continue with other switches
      }
    }
    
    res.json(allVxlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vxlans/:switchId - Get VXLANs from a specific switch
router.get('/:switchId', async (req, res) => {
  try {
    const client = await getSwitchClient(req.params.switchId);
    const vxlans = await client.getVxlans();
    
    // Format VXLANs for response
    const formattedVxlans = vxlans.map(vxlan => ({
      id: `vxlan-${vxlan.vni}-${Date.now()}`,
      vni: vxlan.vni,
      name: `VXLAN-${vxlan.vni}`, // Default name if not specified
      vlan: vxlan.vlan,
      vtepIps: vxlan.floodList || [],
      status: 'active',
      tunnelCount: (vxlan.floodList || []).length
    }));
    
    res.json(formattedVxlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vxlans/:switchId - Create a new VXLAN on a specific switch
router.post('/:switchId', async (req, res) => {
  try {
    const { vni, name, vlan, sourceInterface, vtepIp } = req.body;
    
    // Validate required fields
    if (!vni || !vlan || !sourceInterface || !vtepIp) {
      return res.status(400).json({ error: 'VNI, VLAN, source interface, and VTEP IP are required' });
    }
    
    // Validate VNI
    const vniNum = parseInt(vni);
    if (isNaN(vniNum) || vniNum < 1 || vniNum > 16777215) {
      return res.status(400).json({ error: 'Invalid VNI (must be between 1-16777215)' });
    }
    
    const client = await getSwitchClient(req.params.switchId);
    
    // Configure the VXLAN on the switch
    await client.configureVxlan({
      vni: vniNum,
      vlan,
      sourceInterface,
      vtepIp
    });
    
    // Get switch info for response
    const switches = await loadSwitchesConfig();
    const switchInfo = switches.find(s => s.id === req.params.switchId);
    
    // Return the created VXLAN
    res.status(201).json({
      id: `vxlan-${vniNum}-${Date.now()}`,
      vni: vniNum,
      name: name || `VXLAN-${vniNum}`,
      vlan,
      vtepIps: [vtepIp],
      status: 'active',
      tunnelCount: 1,
      switches: [{
        id: switchInfo.id,
        hostname: switchInfo.hostname
      }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vxlans/:switchId/interfaces - Get available interfaces for VXLAN source
router.get('/:switchId/interfaces', async (req, res) => {
  try {
    const client = await getSwitchClient(req.params.switchId);
    const [interfaceStatus] = await client.runCommands(['show interfaces status']);
    
    // Filter for loopback interfaces which are commonly used as VXLAN source
    const loopbacks = Object.entries(interfaceStatus.interfaceStatuses)
      .filter(([name]) => name.toLowerCase().startsWith('loopback'))
      .map(([name, data]) => ({
        name,
        status: data.linkStatus,
        description: data.description || ''
      }));
    
    res.json(loopbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vxlans/:switchId/preview - Get configuration preview
router.post('/:switchId/preview', async (req, res) => {
  try {
    const { vni, vlan, sourceInterface, vtepIp } = req.body;
    
    // Validate required fields
    if (!vni || !vlan || !sourceInterface || !vtepIp) {
      return res.status(400).json({ error: 'VNI, VLAN, source interface, and VTEP IP are required' });
    }
    
    // Create the configuration commands
    const commands = [
      '!',
      '! VXLAN Configuration Preview',
      '!',
      'interface vxlan 1',
      `  vxlan vni ${vni} vlan ${vlan}`,
      `  vxlan source-interface ${sourceInterface}`,
      `  vxlan vlan ${vlan} vni ${vni}`,
      `  vxlan flood vtep ${vtepIp}`,
      '!'
    ];
    
    const client = await getSwitchClient(req.params.switchId);
    const configPreview = commands.join('\n');
    
    res.json({ configPreview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
