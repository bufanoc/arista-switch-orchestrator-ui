
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Network, Plus, Edit, Trash2 } from "lucide-react";

interface VLAN {
  id: string;
  vlanId: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  switches: string[];
}

const VLANManager = () => {
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [showAddVLAN, setShowAddVLAN] = useState(false);
  const [newVLAN, setNewVLAN] = useState({
    vlanId: "",
    name: "",
    description: "",
    status: "active" as const
  });

  const handleAddVLAN = () => {
    if (newVLAN.vlanId && newVLAN.name) {
      const vlan: VLAN = {
        id: `vlan-${Date.now()}`,
        vlanId: parseInt(newVLAN.vlanId),
        name: newVLAN.name,
        description: newVLAN.description,
        status: newVLAN.status,
        switches: []
      };
      setVlans([...vlans, vlan]);
      setNewVLAN({ vlanId: "", name: "", description: "", status: "active" });
      setShowAddVLAN(false);
    }
  };

  const handleDeleteVLAN = (id: string) => {
    setVlans(vlans.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">VLAN Management</h2>
          <p className="text-slate-400">Configure VLANs across your switch infrastructure</p>
        </div>
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

      {/* VLAN Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Network className="h-5 w-5 mr-2 text-cyan-400" />
            VLANs ({vlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vlans.length === 0 ? (
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
                          size="sm" 
                          variant="outline" 
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDeleteVLAN(vlan.id)}
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

export default VLANManager;
