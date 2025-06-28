
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Network } from "lucide-react";
import CLIDiffViewer from "@/components/CLIDiffViewer";

const VLANManager = () => {
  const [vlans, setVlans] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [newVlan, setNewVlan] = useState({ id: "", name: "", state: "active", switch: "" });

  const mockDiff = `! Generated CLI configuration for VLAN ${newVlan.id}
vlan ${newVlan.id}
   name ${newVlan.name}
   state ${newVlan.state}
!
interface Vlan${newVlan.id}
   description ${newVlan.name} VLAN Interface
!`;

  const handleCreateVlan = () => {
    if (!newVlan.id || !newVlan.name || !newVlan.switch) return;
    setShowDiffDialog(true);
  };

  const handleCommitVlan = () => {
    const vlan = {
      id: parseInt(newVlan.id),
      name: newVlan.name,
      state: newVlan.state,
      switch: newVlan.switch
    };
    
    setVlans([...vlans, vlan]);
    setNewVlan({ id: "", name: "", state: "active", switch: "" });
    setShowDiffDialog(false);
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">VLAN Management</h2>
          <p className="text-slate-400">Configure and manage VLANs across your switches</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create VLAN
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New VLAN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vlan-id">VLAN ID</Label>
                  <Input
                    id="vlan-id"
                    type="number"
                    placeholder="e.g., 100"
                    value={newVlan.id}
                    onChange={(e) => setNewVlan({ ...newVlan, id: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="vlan-name">VLAN Name</Label>
                  <Input
                    id="vlan-name"
                    placeholder="e.g., PRODUCTION"
                    value={newVlan.name}
                    onChange={(e) => setNewVlan({ ...newVlan, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vlan-state">State</Label>
                  <Select value={newVlan.state} onValueChange={(value) => setNewVlan({ ...newVlan, state: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="switch">Target Switch</Label>
                  <Select value={newVlan.switch} onValueChange={(value) => setNewVlan({ ...newVlan, switch: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="no-switches">No switches available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVlan} className="bg-cyan-500 hover:bg-cyan-600">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Config
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* VLAN Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Current VLANs</CardTitle>
        </CardHeader>
        <CardContent>
          {vlans.length === 0 ? (
            <div className="text-center py-8">
              <Network className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No VLANs configured yet</p>
              <p className="text-slate-500 text-sm">Create your first VLAN to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">VLAN ID</TableHead>
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">State</TableHead>
                  <TableHead className="text-slate-400">Switch</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vlans.map((vlan) => (
                  <TableRow key={`${vlan.switch}-${vlan.id}`} className="border-slate-800">
                    <TableCell className="font-mono text-cyan-400 font-bold">{vlan.id}</TableCell>
                    <TableCell className="text-white font-medium">{vlan.name}</TableCell>
                    <TableCell>
                      {vlan.state === "active" ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Suspended
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-slate-300">{vlan.switch}</TableCell>
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
            <DialogTitle>Configuration Preview - VLAN {newVlan.id}</DialogTitle>
          </DialogHeader>
          <CLIDiffViewer config={mockDiff} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDiffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommitVlan} className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Commit Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VLANManager;
