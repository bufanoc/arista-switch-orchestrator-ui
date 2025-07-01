import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Network, Plus, Edit, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { VLANsAPI, VLAN } from "@/lib/api-client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

// Using VLAN interface from api-client.ts

const VLANManager = () => {
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddVLAN, setShowAddVLAN] = useState(false);
  const [selectedSwitches, setSelectedSwitches] = useState<string[]>([]);
  const [availableSwitches, setAvailableSwitches] = useState<{id: string, hostname: string}[]>([]);
  const [newVLAN, setNewVLAN] = useState<{
    vlanId: string;
    name: string;
    description: string;
    status: "active" | "inactive";
  }>({
    vlanId: "",
    name: "",
    description: "",
    status: "active"
  });
  
  // Fetch VLANs when component mounts
  useEffect(() => {
    fetchVLANs();
    fetchSwitches();
  }, []);
  
  const fetchVLANs = async () => {
    setIsLoading(true);
    try {
      const data = await VLANsAPI.getAllVLANs();
      setVlans(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load VLANs";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSwitches = async () => {
    try {
      const switches = await VLANsAPI.getSwitches();
      setAvailableSwitches(switches);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load switches";
      toast.error(errorMsg);
    }
  };
  
  const refreshVLANs = async () => {
    setRefreshing(true);
    try {
      const data = await VLANsAPI.getAllVLANs();
      setVlans(data);
      toast.success("VLAN data refreshed");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to refresh VLANs";
      toast.error(errorMsg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddVLAN = async () => {
    if (!newVLAN.vlanId || !newVLAN.name || selectedSwitches.length === 0) {
      toast.error("Please fill in all required fields and select at least one switch");
      return;
    }
    
    setIsLoading(true);
    try {
      const vlanId = parseInt(newVLAN.vlanId);
      const result = await VLANsAPI.createVLAN({
        vlanId: vlanId,
        name: newVLAN.name,
        description: newVLAN.description || "",
        switchIds: selectedSwitches
      });
      
      // Refresh the list of VLANs
      await fetchVLANs();
      
      toast.success(`VLAN ${vlanId} created successfully on ${selectedSwitches.length} switches`);
      setNewVLAN({ vlanId: "", name: "", description: "", status: "active" });
      setSelectedSwitches([]);
      setShowAddVLAN(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create VLAN";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVLAN = async (vlan: VLAN) => {
    if (!confirm(`Are you sure you want to delete VLAN ${vlan.vlanId} (${vlan.name})?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      await VLANsAPI.deleteVLAN(vlan.vlanId.toString(), vlan.switches);
      
      // Refresh the list of VLANs
      await fetchVLANs();
      toast.success(`VLAN ${vlan.vlanId} deleted successfully`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete VLAN";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSwitchSelection = (switchId: string) => {
    setSelectedSwitches(prev => 
      prev.includes(switchId) 
        ? prev.filter(id => id !== switchId) 
        : [...prev, switchId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">VLAN Management</h2>
          <p className="text-slate-400">Configure VLANs across your switch infrastructure</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshVLANs} 
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            disabled={refreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showAddVLAN} onOpenChange={setShowAddVLAN}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add VLAN
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New VLAN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vlan-id">VLAN ID</Label>
                <Input
                  id="vlan-id"
                  type="number"
                  placeholder="e.g., 100"
                  value={newVLAN.vlanId}
                  onChange={(e) => setNewVLAN({ ...newVLAN, vlanId: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="vlan-name">Name</Label>
                <Input
                  id="vlan-name"
                  placeholder="e.g., Production"
                  value={newVLAN.name}
                  onChange={(e) => setNewVLAN({ ...newVLAN, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="vlan-description">Description</Label>
                <Input
                  id="vlan-description"
                  placeholder="Optional description"
                  value={newVLAN.description}
                  onChange={(e) => setNewVLAN({ ...newVLAN, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="vlan-status">Status</Label>
                <Select value={newVLAN.status} onValueChange={(value: string) => setNewVLAN({ ...newVLAN, status: value as "active" | "inactive" })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Select Switches</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-800 rounded-md">
                  {availableSwitches.length === 0 ? (
                    <div className="col-span-2 text-center py-2 text-slate-400">
                      <AlertTriangle className="h-4 w-4 inline-block mr-1 text-yellow-500" />
                      No switches available
                    </div>
                  ) : (
                    availableSwitches.map(sw => (
                      <div key={sw.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`switch-${sw.id}`} 
                          checked={selectedSwitches.includes(sw.id)} 
                          onCheckedChange={() => toggleSwitchSelection(sw.id)}
                        />
                        <Label htmlFor={`switch-${sw.id}`} className="text-sm">{sw.hostname}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddVLAN(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVLAN} className="bg-cyan-500 hover:bg-cyan-600">
                  Create VLAN
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* VLAN Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Network className="h-5 w-5 mr-2 text-cyan-400" />
            VLANs ({vlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto text-slate-600 mb-4 animate-spin" />
              <p className="text-slate-400">Loading VLANs...</p>
            </div>
          ) : vlans.length === 0 ? (
            <div className="text-center py-8">
              <Network className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No VLANs configured</p>
              <p className="text-slate-500 text-sm">Click "Add VLAN" to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">VLAN ID</TableHead>
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Description</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Switches</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vlans.map((vlan) => (
                  <TableRow key={vlan.id} className="border-slate-800">
                    <TableCell className="font-mono text-white">{vlan.vlanId}</TableCell>
                    <TableCell className="text-white">{vlan.name}</TableCell>
                    <TableCell className="text-slate-300">{vlan.description || "—"}</TableCell>
                    <TableCell>
                      <Badge className={vlan.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-gray-500/20 text-gray-400 border-gray-500/50"}>
                        {vlan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{vlan.switches.length}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-red-400"
                          onClick={() => handleDeleteVLAN(vlan)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VLANManager;
