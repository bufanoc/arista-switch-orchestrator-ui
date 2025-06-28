import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertCircle, CheckCircle, Clock, Network, Server, Wifi, Plus } from "lucide-react";
import AddSwitchDialog from "./AddSwitchDialog";

// Mock data - in real app this would come from API
const mockSwitches = [
  {
    id: 1,
    hostname: "arista-leaf-01",
    mgmtIP: "192.168.1.101",
    eosVersion: "4.29.2F",
    uptime: "15d 8h 23m",
    status: "connected",
    model: "DCS-7050SX3-48YC12"
  },
  {
    id: 2,
    hostname: "arista-leaf-02", 
    mgmtIP: "192.168.1.102",
    eosVersion: "4.29.2F",
    uptime: "15d 8h 19m",
    status: "connected",
    model: "DCS-7050SX3-48YC12"
  },
  {
    id: 3,
    hostname: "arista-spine-01",
    mgmtIP: "192.168.1.201",
    eosVersion: "4.28.3M",
    uptime: "22d 14h 7m", 
    status: "warning",
    model: "DCS-7280SR3-48YC8"
  }
];

const Dashboard = () => {
  const [showAddSwitch, setShowAddSwitch] = useState(false);
  const connectedCount = mockSwitches.filter(s => s.status === "connected").length;
  const totalCount = mockSwitches.length;

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
            <div className="text-2xl font-bold text-white">127</div>
            <p className="text-xs text-slate-500 mt-1">across all switches</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">VXLAN Tunnels</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">23</div>
            <p className="text-xs text-slate-500 mt-1">active VNIs</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Last Commit</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2m</div>
            <p className="text-xs text-slate-500 mt-1">ago</p>
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
            <Button 
              onClick={() => setShowAddSwitch(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Switch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
              {mockSwitches.map((sw) => (
                <TableRow key={sw.id} className="border-slate-800">
                  <TableCell>
                    {sw.status === "connected" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Warning
                      </Badge>
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
        </CardContent>
      </Card>

      <AddSwitchDialog 
        open={showAddSwitch} 
        onOpenChange={setShowAddSwitch}
      />
    </div>
  );
};

export default Dashboard;
