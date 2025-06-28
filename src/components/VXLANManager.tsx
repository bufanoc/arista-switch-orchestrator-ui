
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, CheckCircle, Activity, Zap } from "lucide-react";
import CLIDiffViewer from "@/components/CLIDiffViewer";

const VXLANManager = () => {
  const [vxlans, setVxlans] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [newVxlan, setNewVxlan] = useState({ 
    vni: "", 
    vlan: "", 
    vtepSourceIP: "", 
    vtepInterface: "Loopback1", 
    multicast: true, 
    udpPort: "4789",
    switch: "" 
  });

  const mockDiff = `! Generated CLI configuration for VXLAN VNI ${newVxlan.vni}
interface Vxlan1
   vxlan source-interface ${newVxlan.vtepInterface}
   vxlan udp-port ${newVxlan.udpPort}
   vxlan vlan ${newVxlan.vlan} vni ${newVxlan.vni}
   ${newVxlan.multicast ? 'vxlan multicast-group 239.1.1.1' : '! L2-only mode'}
!
router-mac address-table
   vlan ${newVxlan.vlan} vni ${newVxlan.vni}
!`;

  const handleCreateVxlan = () => {
    if (!newVxlan.vni || !newVxlan.vlan || !newVxlan.vtepSourceIP || !newVxlan.switch) return;
    setShowDiffDialog(true);
  };

  const handleCommitVxlan = () => {
    const vxlan = {
      vni: parseInt(newVxlan.vni),
      vlan: parseInt(newVxlan.vlan),
      vtepSourceIP: newVxlan.vtepSourceIP,
      vtepInterface: newVxlan.vtepInterface,
      multicast: newVxlan.multicast,
      udpPort: parseInt(newVxlan.udpPort),
      switch: newVxlan.switch
    };
    
    setVxlans([...vxlans, vxlan]);
    setNewVxlan({ 
      vni: "", 
      vlan: "", 
      vtepSourceIP: "", 
      vtepInterface: "Loopback1", 
      multicast: true, 
      udpPort: "4789",
      switch: "" 
    });
    setShowDiffDialog(false);
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">VXLAN Management</h2>
          <p className="text-slate-400">Configure VXLAN overlays and VTEP interfaces</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create VXLAN
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New VXLAN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vni">VNI</Label>
                  <Input
                    id="vni"
                    type="number"
                    placeholder="e.g., 10010"
                    value={newVxlan.vni}
                    onChange={(e) => setNewVxlan({ ...newVxlan, vni: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="vlan">VLAN ID</Label>
                  <Input
                    id="vlan"
                    type="number"
                    placeholder="e.g., 10"
                    value={newVxlan.vlan}
                    onChange={(e) => setNewVxlan({ ...newVxlan, vlan: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vtep-ip">VTEP Source IP</Label>
                  <Input
                    id="vtep-ip"
                    placeholder="e.g., 10.1.1.1"
                    value={newVxlan.vtepSourceIP}
                    onChange={(e) => setNewVxlan({ ...newVxlan, vtepSourceIP: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="vtep-interface">VTEP Interface</Label>
                  <Select 
                    value={newVxlan.vtepInterface} 
                    onValueChange={(value) => setNewVxlan({ ...newVxlan, vtepInterface: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Loopback1">Loopback1</SelectItem>
                      <SelectItem value="Loopback2">Loopback2</SelectItem>
                      <SelectItem value="Ethernet1">Ethernet1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="udp-port">UDP Port</Label>
                  <Input
                    id="udp-port"
                    type="number"
                    value={newVxlan.udpPort}
                    onChange={(e) => setNewVxlan({ ...newVxlan, udpPort: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="switch">Target Switch</Label>
                  <Select value={newVxlan.switch} onValueChange={(value) => setNewVxlan({ ...newVxlan, switch: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="no-switches">No switches available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="multicast" 
                  checked={newVxlan.multicast}
                  onCheckedChange={(checked) => setNewVxlan({ ...newVxlan, multicast: checked })}
                />
                <Label htmlFor="multicast">Enable Multicast</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVxlan} className="bg-cyan-500 hover:bg-cyan-600">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Config
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* VXLAN Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Current VXLANs</CardTitle>
        </CardHeader>
        <CardContent>
          {vxlans.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No VXLANs configured yet</p>
              <p className="text-slate-500 text-sm">Create your first VXLAN overlay to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">VNI</TableHead>
                  <TableHead className="text-slate-400">VLAN</TableHead>
                  <TableHead className="text-slate-400">VTEP Source</TableHead>
                  <TableHead className="text-slate-400">Interface</TableHead>
                  <TableHead className="text-slate-400">Mode</TableHead>
                  <TableHead className="text-slate-400">UDP Port</TableHead>
                  <TableHead className="text-slate-400">Switch</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vxlans.map((vxlan) => (
                  <TableRow key={`${vxlan.switch}-${vxlan.vni}`} className="border-slate-800">
                    <TableCell className="font-mono text-cyan-400 font-bold">{vxlan.vni}</TableCell>
                    <TableCell className="font-mono text-white">{vxlan.vlan}</TableCell>
                    <TableCell className="font-mono text-slate-300">{vxlan.vtepSourceIP}</TableCell>
                    <TableCell className="font-mono text-slate-300">{vxlan.vtepInterface}</TableCell>
                    <TableCell>
                      {vxlan.multicast ? (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          <Activity className="h-3 w-3 mr-1" />
                          Multicast
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                          L2-Only
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-slate-300">{vxlan.udpPort}</TableCell>
                    <TableCell className="font-mono text-slate-300">{vxlan.switch}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400">
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

      {/* CLI Diff Dialog */}
      <Dialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Configuration Preview - VXLAN VNI {newVxlan.vni}</DialogTitle>
          </DialogHeader>
          <CLIDiffViewer config={mockDiff} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDiffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommitVxlan} className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Commit Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VXLANManager;
