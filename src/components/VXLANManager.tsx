
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Plus, Edit, Trash2, Activity } from "lucide-react";

interface VXLAN {
  id: string;
  vni: number;
  name: string;
  vlan: number;
  vtepIps: string[];
  status: "active" | "inactive";
  tunnelCount: number;
}

const VXLANManager = () => {
  const [vxlans, setVxlans] = useState<VXLAN[]>([]);
  const [showAddVXLAN, setShowAddVXLAN] = useState(false);
  const [newVXLAN, setNewVXLAN] = useState({
    vni: "",
    name: "",
    vlan: "",
    status: "active" as const
  });

  const handleAddVXLAN = () => {
    if (newVXLAN.vni && newVXLAN.name && newVXLAN.vlan) {
      const vxlan: VXLAN = {
        id: `vxlan-${Date.now()}`,
        vni: parseInt(newVXLAN.vni),
        name: newVXLAN.name,
        vlan: parseInt(newVXLAN.vlan),
        vtepIps: [],
        status: newVXLAN.status,
        tunnelCount: 0
      };
      setVxlans([...vxlans, vxlan]);
      setNewVXLAN({ vni: "", name: "", vlan: "", status: "active" });
      setShowAddVXLAN(false);
    }
  };

  const handleDeleteVXLAN = (id: string) => {
    setVxlans(vxlans.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">VXLAN Management</h2>
          <p className="text-slate-400">Configure VXLAN overlays and network virtualization</p>
        </div>
        <Dialog open={showAddVXLAN} onOpenChange={setShowAddVXLAN}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add VXLAN
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New VXLAN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vni">VNI (VXLAN Network Identifier)</Label>
                <Input
                  id="vni"
                  type="number"
                  placeholder="e.g., 10001"
                  value={newVXLAN.vni}
                  onChange={(e) => setNewVXLAN({ ...newVXLAN, vni: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="vxlan-name">Name</Label>
                <Input
                  id="vxlan-name"
                  placeholder="e.g., Tenant-A"
                  value={newVXLAN.name}
                  onChange={(e) => setNewVXLAN({ ...newVXLAN, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="mapped-vlan">Mapped VLAN</Label>
                <Input
                  id="mapped-vlan"
                  type="number"
                  placeholder="e.g., 100"
                  value={newVXLAN.vlan}
                  onChange={(e) => setNewVXLAN({ ...newVXLAN, vlan: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="vxlan-status">Status</Label>
                <Select value={newVXLAN.status} onValueChange={(value: string) => setNewVXLAN({ ...newVXLAN, status: value as "active" | "inactive" })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddVXLAN(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVXLAN} className="bg-cyan-500 hover:bg-cyan-600">
                  Create VXLAN
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total VXLANs</CardTitle>
            <Zap className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{vxlans.length}</div>
            <p className="text-xs text-slate-500 mt-1">configured networks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active VNIs</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{vxlans.filter(v => v.status === "active").length}</div>
            <p className="text-xs text-slate-500 mt-1">operational tunnels</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Tunnels</CardTitle>
            <Zap className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{vxlans.reduce((sum, v) => sum + v.tunnelCount, 0)}</div>
            <p className="text-xs text-slate-500 mt-1">established connections</p>
          </CardContent>
        </Card>
      </div>

      {/* VXLAN Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="h-5 w-5 mr-2 text-cyan-400" />
            VXLAN Networks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vxlans.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No VXLANs configured</p>
              <p className="text-slate-500 text-sm">Click "Add VXLAN" to create your first overlay network</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">VNI</TableHead>
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Mapped VLAN</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">VTEP Count</TableHead>
                  <TableHead className="text-slate-400">Tunnels</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vxlans.map((vxlan) => (
                  <TableRow key={vxlan.id} className="border-slate-800">
                    <TableCell className="font-mono text-white">{vxlan.vni}</TableCell>
                    <TableCell className="text-white">{vxlan.name}</TableCell>
                    <TableCell className="font-mono text-slate-300">{vxlan.vlan}</TableCell>
                    <TableCell>
                      <Badge className={vxlan.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-gray-500/20 text-gray-400 border-gray-500/50"}>
                        {vxlan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{vxlan.vtepIps.length}</TableCell>
                    <TableCell className="text-slate-300">{vxlan.tunnelCount}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDeleteVXLAN(vxlan.id)}
                        >
                          <Trash2 className="h-3 w-3" />
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

export default VXLANManager;
