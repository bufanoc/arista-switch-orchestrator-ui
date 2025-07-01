// Test script to verify connectivity to configured switches
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import AristaClient from '../lib/arista-client.js';

// Setup paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SWITCHES_CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'switches.json');

async function loadSwitchesConfig() {
  try {
    const data = await fs.readFile(SWITCHES_CONFIG_PATH, 'utf8');
    const config = JSON.parse(data);
    return config.switches || [];
  } catch (error) {
    console.error(`Error loading switches config: ${error.message}`);
    return [];
  }
}

async function testSwitch(switchConfig) {
  console.log(`\n=== Testing switch: ${switchConfig.hostname} (${switchConfig.mgmtIP}) ===`);
  
  try {
    const client = new AristaClient({
      host: switchConfig.mgmtIP,
      username: switchConfig.username,
      password: switchConfig.password
    });
    
    // Test basic connectivity
    console.log('Testing basic connectivity...');
    const connectionTest = await client.testConnection();
    
    if (!connectionTest.connected) {
      console.error(`✗ Connection failed: ${connectionTest.error}`);
      return false;
    }
    
    console.log(`✓ Connection successful!`);
    console.log(`  Hostname: ${connectionTest.hostname}`);
    console.log(`  Model: ${connectionTest.model}`);
    console.log(`  EOS Version: ${connectionTest.eosVersion}`);
    console.log(`  Uptime: ${connectionTest.uptime}`);
    
    // Test getting VLANs
    console.log('\nRetrieving VLANs...');
    try {
      const vlans = await client.getVlans();
      console.log(`✓ Retrieved ${vlans.length} VLANs`);
      
      if (vlans.length > 0) {
        console.log('  Sample VLAN:');
        console.log(`    VLAN ID: ${vlans[0].vlanId}`);
        console.log(`    Name: ${vlans[0].name}`);
        console.log(`    Status: ${vlans[0].status}`);
      }
    } catch (error) {
      console.error(`✗ Error retrieving VLANs: ${error.message}`);
    }
    
    // Test getting VXLANs
    console.log('\nRetrieving VXLANs...');
    try {
      const vxlans = await client.getVxlans();
      console.log(`✓ Retrieved ${vxlans.length} VXLANs`);
      
      if (vxlans.length > 0) {
        console.log('  Sample VXLAN:');
        console.log(`    VNI: ${vxlans[0].vni}`);
        console.log(`    VLAN: ${vxlans[0].vlan}`);
      }
    } catch (error) {
      console.error(`✗ Error retrieving VXLANs: ${error.message}`);
    }
    
    // Test running a show command
    console.log('\nRunning "show version" command...');
    try {
      const [versionInfo] = await client.runCommands(['show version']);
      console.log(`✓ Command executed successfully`);
      console.log(`  System MAC: ${versionInfo.systemMacAddress}`);
      console.log(`  Serial Number: ${versionInfo.serialNumber}`);
      console.log(`  Architecture: ${versionInfo.architecture}`);
    } catch (error) {
      console.error(`✗ Error running command: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`✗ Error testing switch: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log('Loading switch configurations...');
    const switches = await loadSwitchesConfig();
    
    if (switches.length === 0) {
      console.error('No switches found in configuration file.');
      return;
    }
    
    console.log(`Found ${switches.length} switches in configuration.`);
    
    let successCount = 0;
    
    for (const switchConfig of switches) {
      const success = await testSwitch(switchConfig);
      if (success) {
        successCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Successfully connected to ${successCount} out of ${switches.length} switches.`);
    
  } catch (error) {
    console.error(`Error in main function: ${error.message}`);
  }
}

main();
