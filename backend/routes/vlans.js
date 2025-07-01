// VLANs API Routes
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

// GET /api/vlans - Get VLANs from all switches
router.get('/', async (req, res) => {
  try {
    const switches = await loadSwitchesConfig();
    const allVlans = [];
    
    // Collect VLANs from all switches
    for (const switchConfig of switches) {
      try {
        const client = new AristaClient({
          host: switchConfig.mgmtIP,
          username: switchConfig.username,
          password: switchConfig.password
        });
        
        const vlans = await client.getVlans();
        
        // Enrich VLAN data with switch information
        vlans.forEach(vlan => {
          const existingVlanIndex = allVlans.findIndex(v => v.vlanId === vlan.vlanId);
          
          if (existingVlanIndex >= 0) {
            // VLAN already exists, add this switch to its switches list
            if (!allVlans[existingVlanIndex].switches.find(s => s.id === switchConfig.id)) {
              allVlans[existingVlanIndex].switches.push({
                id: switchConfig.id,
                hostname: switchConfig.hostname
              });
            }
          } else {
            // New VLAN, add it to the list
            allVlans.push({
              id: `vlan-${vlan.vlanId}-${Date.now()}`,
              vlanId: vlan.vlanId,
              name: vlan.name,
              status: vlan.status === 'active' ? 'active' : 'inactive',
              switches: [{
                id: switchConfig.id,
                hostname: switchConfig.hostname
              }]
            });
          }
        });
      } catch (error) {
        console.error(`Error fetching VLANs from ${switchConfig.hostname}: ${error.message}`);
        // Continue with other switches
      }
    }
    
    res.json(allVlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vlans/:switchId - Get VLANs from a specific switch
router.get('/:switchId', async (req, res) => {
  try {
    const client = await getSwitchClient(req.params.switchId);
    const vlans = await client.getVlans();
    
    // Format VLANs for response
    const formattedVlans = vlans.map(vlan => ({
      id: `vlan-${vlan.vlanId}-${Date.now()}`,
      vlanId: vlan.vlanId,
      name: vlan.name,
      status: vlan.status === 'active' ? 'active' : 'inactive',
      interfaces: vlan.interfaces || []
    }));
    
    res.json(formattedVlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vlans/:switchId - Create a new VLAN on a specific switch
router.post('/:switchId', async (req, res) => {
  try {
    const { vlanId, name, description } = req.body;
    
    // Validate required fields
    if (!vlanId || !name) {
      return res.status(400).json({ error: 'VLAN ID and name are required' });
    }
    
    // Validate VLAN ID
    const vlanIdNum = parseInt(vlanId);
    if (isNaN(vlanIdNum) || vlanIdNum < 1 || vlanIdNum > 4094) {
      return res.status(400).json({ error: 'Invalid VLAN ID (must be between 1-4094)' });
    }
    
    const client = await getSwitchClient(req.params.switchId);
    
    // Create the VLAN on the switch
    await client.createVlan(vlanIdNum, name);
    
    // Get switch info for response
    const switches = await loadSwitchesConfig();
    const switchInfo = switches.find(s => s.id === req.params.switchId);
    
    // Return the created VLAN
    res.status(201).json({
      id: `vlan-${vlanIdNum}-${Date.now()}`,
      vlanId: vlanIdNum,
      name,
      description: description || '',
      status: 'active',
      switches: [{
        id: switchInfo.id,
        hostname: switchInfo.hostname
      }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/vlans/:switchId/:vlanId - Delete a VLAN from a specific switch
router.delete('/:switchId/:vlanId', async (req, res) => {
  try {
    const vlanId = parseInt(req.params.vlanId);
    
    if (isNaN(vlanId)) {
      return res.status(400).json({ error: 'Invalid VLAN ID' });
    }
    
    const client = await getSwitchClient(req.params.switchId);
    
    // Delete the VLAN
    await client.deleteVlan(vlanId);
    
    res.json({ success: true, vlanId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vlans/:switchId/batch - Create multiple VLANs on a switch
router.post('/:switchId/batch', async (req, res) => {
  try {
    const { vlans } = req.body;
    
    if (!Array.isArray(vlans) || vlans.length === 0) {
      return res.status(400).json({ error: 'No VLANs provided' });
    }
    
    const client = await getSwitchClient(req.params.switchId);
    const results = [];
    
    for (const vlan of vlans) {
      try {
        if (!vlan.vlanId || !vlan.name) {
          results.push({
            success: false,
            vlanId: vlan.vlanId,
            error: 'VLAN ID and name are required'
          });
          continue;
        }
        
        // Create the VLAN
        await client.createVlan(vlan.vlanId, vlan.name);
        
        results.push({
          success: true,
          vlanId: vlan.vlanId,
          name: vlan.name
        });
      } catch (error) {
        results.push({
          success: false,
          vlanId: vlan.vlanId,
          error: error.message
        });
      }
    }
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
