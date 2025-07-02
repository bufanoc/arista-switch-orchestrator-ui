// API Client for Arista Switch Manager
import { toast } from "sonner";

// Types
export interface Switch {
  id: string;
  hostname: string;
  mgmtIP: string;
  username: string;
  password: string;
  model?: string;
  eosVersion?: string;
  uptime?: string;
  status: "connected" | "disconnected" | "warning";
}

export interface VLAN {
  id: string;
  vlanId: number;
  name: string;
  description?: string;
  status: "active" | "inactive";
  switches: { id: string; hostname: string }[];
}

export interface VXLAN {
  id: string;
  vni: number;
  name: string;
  vlan: number;
  vtepIps: string[];
  status: "active" | "inactive";
  tunnelCount: number;
  switches?: { id: string; hostname: string }[];
}

export interface Tunnel {
  id: string;
  vni: number;
  vlan: number;
  type?: string;
  sourceInterface?: string;
  vteps: string[];
  status: "active" | "inactive";
}

export interface TunnelConfig {
  switchA: string;
  switchB: string;
  vni: number;
  vtepA: string;
  vtepB: string;
  sourceInterfaceA: string;
  sourceInterfaceB: string;
  sessionA?: string;
  sessionB?: string;
}

export interface TunnelResult {
  success: boolean;
  sessionId?: string;
  status?: "inProgress" | "success" | "failed";
  phases?: {
    name: string;
    status: "pending" | "inProgress" | "complete" | "failed";
    progress: number;
  }[];
  error?: string;
  errorMessage?: string | null;
  configA?: string;
  configB?: string;
}

// Base API URL
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for API requests with error handling
async function apiRequest<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });

    // Parse JSON response
    const data = await response.json();

    // Handle API error responses
    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.statusText}`);
    }

    return data as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
    toast.error(errorMessage);
    throw error;
  }
}

// Switches API
export const SwitchesAPI = {
  /**
   * Get all switches
   * @returns Promise<Switch[]>
   */
  getAllSwitches: async (): Promise<Switch[]> => {
    return apiRequest<Switch[]>('/switches');
  },

  /**
   * Get a specific switch by ID
   * @param id Switch ID
   * @returns Promise<Switch>
   */
  getSwitch: async (id: string): Promise<Switch> => {
    return apiRequest<Switch>(`/switches/${id}`);
  },

  /**
   * Add a new switch
   * @param switchData Switch data
   * @returns Promise<Switch>
   */
  addSwitch: async (switchData: Omit<Switch, 'id' | 'status' | 'eosVersion' | 'uptime'>): Promise<Switch> => {
    return apiRequest<Switch>('/switches', {
      method: 'POST',
      body: JSON.stringify(switchData)
    });
  },

  /**
   * Update a switch
   * @param id Switch ID
   * @param switchData Switch data to update
   * @returns Promise<Switch>
   */
  updateSwitch: async (id: string, switchData: Partial<Switch>): Promise<Switch> => {
    return apiRequest<Switch>(`/switches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(switchData)
    });
  },

  /**
   * Delete a switch
   * @param id Switch ID
   * @returns Promise<{success: boolean, id: string}>
   */
  deleteSwitch: async (id: string): Promise<{success: boolean, id: string}> => {
    return apiRequest<{success: boolean, id: string}>(`/switches/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get detailed switch info
   * @param id Switch ID
   * @returns Promise<any>
   */
  getSwitchInfo: async (id: string): Promise<any> => {
    return apiRequest<any>(`/switches/${id}/info`);
  },

  /**
   * Test connection to a switch
   * @param switchData Switch connection data
   * @returns Promise<{connected: boolean, hostname?: string, model?: string, eosVersion?: string, error?: string}>
   */
  testConnection: async (
    switchData: {hostname: string, mgmtIP: string, username: string, password: string}
  ): Promise<{connected: boolean, hostname?: string, model?: string, eosVersion?: string, uptime?: string, error?: string}> => {
    return apiRequest<any>('/switches', {
      method: 'POST',
      body: JSON.stringify({ ...switchData, test: true })
    });
  }
};

// VLANs API
export const VLANsAPI = {
  /**
   * Get all VLANs across all switches
   * @returns Promise<VLAN[]>
   */
  getAllVLANs: async (): Promise<VLAN[]> => {
    return apiRequest<VLAN[]>('/vlans');
  },

  /**
   * Get all available switches for VLAN management
   * @returns Promise<{id: string, hostname: string}[]>
   */
  getSwitches: async (): Promise<{id: string, hostname: string}[]> => {
    return apiRequest<{id: string, hostname: string}[]>('/vlans/switches');
  },

  /**
   * Get VLANs for a specific switch
   * @param switchId Switch ID
   * @returns Promise<VLAN[]>
   */
  getSwitchVLANs: async (switchId: string): Promise<VLAN[]> => {
    return apiRequest<VLAN[]>(`/vlans/${switchId}`);
  },

  /**
   * Create a new VLAN across multiple switches
   * @param vlanData VLAN data with switch IDs
   * @returns Promise<{success: boolean, vlanId: number}>
   */
  createVLAN: async (vlanData: {
    vlanId: number, 
    name: string, 
    description?: string,
    switchIds: string[]
  }): Promise<{success: boolean, vlanId: number}> => {
    return apiRequest<{success: boolean, vlanId: number}>('/vlans', {
      method: 'POST',
      body: JSON.stringify(vlanData)
    });
  },

  /**
   * Add a new VLAN to a switch
   * @param switchId Switch ID
   * @param vlanData VLAN data
   * @returns Promise<VLAN>
   */
  addVLAN: async (switchId: string, vlanData: {vlanId: number, name: string, description?: string}): Promise<VLAN> => {
    return apiRequest<VLAN>(`/vlans/${switchId}`, {
      method: 'POST',
      body: JSON.stringify(vlanData)
    });
  },

  /**
   * Delete a VLAN from a switch or multiple switches
   * @param vlanId VLAN ID
   * @param switchIds Array of Switch IDs or single switch ID
   * @returns Promise<{success: boolean, vlanId: number}>
   */
  deleteVLAN: async (vlanId: string, switchIds: string[]): Promise<{success: boolean, vlanId: number}> => {
    return apiRequest<{success: boolean, vlanId: number}>(`/vlans/${vlanId}`, {
      method: 'DELETE',
      body: JSON.stringify({ switchIds })
    });
  }
};

// VXLANs API
export const VXLANsAPI = {
  /**
   * Get all VXLANs across all switches
   * @returns Promise<VXLAN[]>
   */
  getAllVXLANs: async (): Promise<VXLAN[]> => {
    return apiRequest<VXLAN[]>('/vxlans');
  },

  /**
   * Get VXLANs for a specific switch
   * @param switchId Switch ID
   * @returns Promise<VXLAN[]>
   */
  getSwitchVXLANs: async (switchId: string): Promise<VXLAN[]> => {
    return apiRequest<VXLAN[]>(`/vxlans/${switchId}`);
  },

  /**
   * Add a new VXLAN to a switch
   * @param switchId Switch ID
   * @param vxlanData VXLAN data
   * @returns Promise<VXLAN>
   */
  addVXLAN: async (
    switchId: string, 
    vxlanData: {vni: number, name: string, vlan: number, sourceInterface: string, vtepIp: string}
  ): Promise<VXLAN> => {
    return apiRequest<VXLAN>(`/vxlans/${switchId}`, {
      method: 'POST',
      body: JSON.stringify(vxlanData)
    });
  },

  /**
   * Get available interfaces for VXLAN source
   * @param switchId Switch ID
   * @returns Promise<{name: string, status: string, description: string}[]>
   */
  getInterfaces: async (switchId: string): Promise<{name: string, status: string, description: string}[]> => {
    return apiRequest<{name: string, status: string, description: string}[]>(`/vxlans/${switchId}/interfaces`);
  },

  /**
   * Get VXLAN configuration preview
   * @param switchId Switch ID
   * @param vxlanData VXLAN configuration data
   * @returns Promise<{configPreview: string}>
   */
  getConfigPreview: async (
    switchId: string, 
    vxlanData: {vni: number, vlan: number, sourceInterface: string, vtepIp: string}
  ): Promise<{configPreview: string}> => {
    return apiRequest<{configPreview: string}>(`/vxlans/${switchId}/preview`, {
      method: 'POST',
      body: JSON.stringify(vxlanData)
    });
  }
};

// Tunnels API
export const TunnelsAPI = {
  /**
   * Get available switches for tunnels
   * @returns Promise<{id: string, hostname: string, model: string}[]>
   */
  getAvailableSwitches: async (): Promise<{id: string, hostname: string, model: string}[]> => {
    return apiRequest<{id: string, hostname: string, model: string}[]>('/tunnels/switches');
  },

  /**
   * Get available VNIs for tunnel configuration
   * @returns Promise<number[]>
   */
  getAvailableVNIs: async (): Promise<number[]> => {
    return apiRequest<number[]>('/tunnels/vnis');
  },

  /**
   * Get interfaces for a specific switch
   * @param switchId Switch ID
   * @returns Promise<{name: string, status: string}[]>
   */
  getSwitchInterfaces: async (switchId: string): Promise<{name: string, status: string}[]> => {
    return apiRequest<{name: string, status: string}[]>(`/tunnels/${switchId}/interfaces`);
  },

  /**
   * Get tunnel configuration preview
   * @param tunnelConfig Tunnel configuration
   * @returns Promise<{configA: string, configB: string}>
   */
  getTunnelPreview: async (
    tunnelConfig: TunnelConfig
  ): Promise<{configA: string, configB: string}> => {
    return apiRequest<{configA: string, configB: string}>('/tunnels/preview', {
      method: 'POST',
      body: JSON.stringify(tunnelConfig)
    });
  },

  /**
   * Create a tunnel between two switches
   * @param tunnelConfig Tunnel configuration
   * @returns Promise<TunnelResult>
   */
  createTunnel: async (tunnelConfig: TunnelConfig): Promise<TunnelResult> => {
    return apiRequest<TunnelResult>('/tunnels/create', {
      method: 'POST',
      body: JSON.stringify(tunnelConfig)
    });
  },

  /**
   * Get tunnels for a specific switch
   * @param switchId Switch ID
   * @returns Promise<Tunnel[]>
   */
  getSwitchTunnels: async (switchId: string): Promise<Tunnel[]> => {
    return apiRequest<Tunnel[]>(`/tunnels/${switchId}`);
  },

  /**
   * Get suggested VNIs
   * @returns Promise<{suggestedVnis: number[]}>
   */
  getSuggestedVnis: async (): Promise<{suggestedVnis: number[]}> => {
    return apiRequest<{suggestedVnis: number[]}>('/tunnels/suggested-vnis', {
      method: 'POST'
    });
  }
};
