// Arista eAPI Client
import fetch from 'node-fetch';

class AristaClient {
  /**
   * Create a new Arista eAPI client
   * @param {Object} config - Connection configuration
   * @param {string} config.host - Switch hostname or IP address
   * @param {number} config.port - eAPI port (default: 443)
   * @param {string} config.username - Username for authentication
   * @param {string} config.password - Password for authentication
   * @param {boolean} config.ssl - Whether to use HTTPS (default: true)
   */
  constructor(config) {
    this.host = config.host;
    this.port = config.port || 443;
    this.username = config.username;
    this.password = config.password;
    this.ssl = config.ssl !== undefined ? config.ssl : true;
    this.baseUrl = `${this.ssl ? 'https' : 'http'}://${this.host}:${this.port}/command-api`;
  }

  /**
   * Execute Arista eAPI commands
   * @param {string[]} commands - Array of CLI commands to execute
   * @param {string} [format="json"] - Output format (json or text)
   * @returns {Promise<Object>} - API response
   */
  async runCommands(commands, format = 'json') {
    const payload = {
      jsonrpc: '2.0',
      method: 'runCmds',
      params: {
        version: 1,
        cmds: commands,
        format: format
      },
      id: Date.now().toString()
    };

    try {
      // Handle self-signed certificates in development
      const fetchOptions = {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
        },
        // In production, this should be properly configured:
        ...(process.env.NODE_ENV !== 'production' && { 
          agent: new (await import('https')).Agent({ rejectUnauthorized: false }) 
        })
      };

      const response = await fetch(this.baseUrl, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`eAPI Error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      return data.result;
    } catch (error) {
      console.error(`Arista eAPI Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test connection to switch
   * @returns {Promise<Object>} - Switch information
   */
  async testConnection() {
    try {
      const [versionInfo] = await this.runCommands(['show version']);
      return {
        connected: true,
        hostname: versionInfo.hostname,
        model: versionInfo.modelName,
        eosVersion: versionInfo.version,
        serialNumber: versionInfo.serialNumber,
        uptime: versionInfo.uptime
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get switch inventory information
   * @returns {Promise<Object>} - Switch information
   */
  async getSwitchInfo() {
    try {
      const [versionInfo, interfaceStatus] = await this.runCommands([
        'show version',
        'show interfaces status'
      ]);

      return {
        hostname: versionInfo.hostname,
        model: versionInfo.modelName,
        eosVersion: versionInfo.version,
        serialNumber: versionInfo.serialNumber,
        uptime: versionInfo.uptime,
        interfaces: interfaceStatus.interfaceStatuses
      };
    } catch (error) {
      console.error(`Error fetching switch info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get VLAN information
   * @returns {Promise<Array>} - Array of VLANs
   */
  async getVlans() {
    try {
      const [vlanInfo] = await this.runCommands(['show vlan']);
      
      return Object.entries(vlanInfo.vlans).map(([vlanId, data]) => ({
        vlanId: parseInt(vlanId),
        name: data.name,
        status: data.status,
        interfaces: data.interfaces || []
      }));
    } catch (error) {
      console.error(`Error fetching VLANs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new VLAN
   * @param {number} vlanId - VLAN ID
   * @param {string} name - VLAN name
   * @returns {Promise<Object>} - Operation result
   */
  async createVlan(vlanId, name) {
    try {
      const commands = [
        'enable',
        'configure',
        `vlan ${vlanId}`,
        `name ${name}`,
        'end'
      ];

      await this.runCommands(commands, 'text');
      return { success: true, vlanId, name };
    } catch (error) {
      console.error(`Error creating VLAN: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a VLAN
   * @param {number} vlanId - VLAN ID
   * @returns {Promise<Object>} - Operation result
   */
  async deleteVlan(vlanId) {
    try {
      const commands = [
        'enable',
        'configure',
        `no vlan ${vlanId}`,
        'end'
      ];

      await this.runCommands(commands, 'text');
      return { success: true, vlanId };
    } catch (error) {
      console.error(`Error deleting VLAN: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get VXLAN configuration
   * @returns {Promise<Array>} - Array of VXLANs
   */
  async getVxlans() {
    try {
      const [vxlanInfo] = await this.runCommands(['show vxlan vni']);
      
      if (!vxlanInfo.vnis) {
        return [];
      }
      
      return Object.entries(vxlanInfo.vnis).map(([vni, data]) => ({
        vni: parseInt(vni),
        floodList: data.floodList || [],
        vlan: data.vlan,
        sourceInterface: data.sourceInterface,
        type: data.type
      }));
    } catch (error) {
      console.error(`Error fetching VXLANs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Configure VXLAN
   * @param {Object} vxlanConfig - VXLAN configuration
   * @returns {Promise<Object>} - Operation result
   */
  async configureVxlan(vxlanConfig) {
    try {
      const { vni, vlan, sourceInterface, vtepIp } = vxlanConfig;
      
      const commands = [
        'enable',
        'configure',
        'interface vxlan 1',
        `vxlan vni ${vni} vlan ${vlan}`,
        `vxlan source-interface ${sourceInterface}`,
        `vxlan vlan ${vlan} vni ${vni}`,
        `vxlan flood vtep ${vtepIp}`,
        'end'
      ];

      await this.runCommands(commands, 'text');
      return { success: true, vni, vlan };
    } catch (error) {
      console.error(`Error configuring VXLAN: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get configuration for CLI preview
   * @param {string[]} commands - Commands to get config for
   * @returns {Promise<string>} - Configuration text
   */
  async getConfigPreview(commands) {
    try {
      const result = await this.runCommands(commands, 'text');
      return result.join('\n');
    } catch (error) {
      console.error(`Error getting config preview: ${error.message}`);
      throw error;
    }
  }
}

export default AristaClient;
