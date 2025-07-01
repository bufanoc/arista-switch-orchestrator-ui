
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertCircle, CheckCircle, Clock, Network, Server, Wifi, Plus, RefreshCw, Trash } from "lucide-react";
import { toast } from "sonner";
import AddSwitchDialog from "./AddSwitchDialog";
import { SwitchesAPI, Switch } from "@/lib/api-client";

const Dashboard = () => {
  const [showAddSwitch, setShowAddSwitch] = useState(false);
  const [switches, setSwitches] = useState<Switch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch all switches when component mounts
  useEffect(() => {
    fetchSwitches();
  }, []);
  
  const fetchSwitches = async () => {
    setIsLoading(true);
    try {
      const data = await SwitchesAPI.getAllSwitches();
      setSwitches(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load switches";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshSwitches = async () => {
    setRefreshing(true);
    try {
      const data = await SwitchesAPI.getAllSwitches();
      setSwitches(data);
      toast.success("Switch data refreshed");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to refresh switches";
      toast.error(errorMsg);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleDeleteSwitch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this switch?")) {
      return;
    }
    
    try {
      await SwitchesAPI.deleteSwitch(id);
      setSwitches(switches.filter(s => s.id !== id));
      toast.success("Switch deleted");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete switch";
      toast.error(errorMsg);
    }
  };
  
  const handleSwitchAdded = (newSwitch: Switch) => {
    setSwitches([...switches, newSwitch]);
  };
  
  const connectedCount = switches.filter(s => s.status === "connected").length;
  const totalCount = switches.length;

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Sessions</CardTitle>
            <Network className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{connectedCount}/{totalCount}</div>
            <p className="text-xs text-slate-500 mt-1">switches connected</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total VLANs</CardTitle>
            <Wifi className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-slate-500 mt-1">across all switches</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">VXLAN Tunnels</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-slate-500 mt-1">active VNIs</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Last Commit</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">--</div>
            <p className="text-xs text-slate-500 mt-1">no commits yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Switch Status Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Server className="h-5 w-5 mr-2 text-cyan-400" />
              Switch Inventory
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={refreshSwitches}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                disabled={refreshing || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => setShowAddSwitch(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Switch
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto text-slate-600 mb-4 animate-spin" />
              <p className="text-slate-400">Loading switches...</p>
            </div>
          ) : switches.length === 0 ? (
            <div className="text-center py-8">
              <Server className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No switches added yet</p>
              <p className="text-slate-500 text-sm">Click "Add Switch" to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Hostname</TableHead>
                  <TableHead className="text-slate-400">Management IP</TableHead>
                  <TableHead className="text-slate-400">EOS Version</TableHead>
                  <TableHead className="text-slate-400">Model</TableHead>
                  <TableHead className="text-slate-400">Uptime</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {switches.map((sw) => (
                  <TableRow key={sw.id} className="border-slate-800">
                    <TableCell>
                      {sw.status === "connected" ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-400"
                            onClick={() => handleDeleteSwitch(sw.id)}
                            title="Delete Switch"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-white">{sw.hostname}</TableCell>
                    <TableCell className="font-mono text-slate-300">{sw.mgmtIP}</TableCell>
                    <TableCell className="font-mono text-slate-300">{sw.eosVersion}</TableCell>
                    <TableCell className="text-slate-300">{sw.model}</TableCell>
                    <TableCell className="font-mono text-slate-300">{sw.uptime}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                      >
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddSwitchDialog 
        open={showAddSwitch} 
        onOpenChange={setShowAddSwitch} 
        onSwitchAdded={handleSwitchAdded}
      />
    </div>
  );
};

export default Dashboard;
