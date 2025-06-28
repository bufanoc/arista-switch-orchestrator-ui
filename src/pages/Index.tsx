
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Network, Settings, Zap } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import VLANManager from "@/components/VLANManager";
import VXLANManager from "@/components/VXLANManager";
import TunnelWizard from "@/components/TunnelWizard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Network className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Arista Lab Switch Manager</h1>
                <p className="text-sm text-slate-400">Network Configuration & Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                <Activity className="h-3 w-3 mr-1" />
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-800">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="vlans"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Network className="h-4 w-4 mr-2" />
              VLANs
            </TabsTrigger>
            <TabsTrigger 
              value="vxlans"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Zap className="h-4 w-4 mr-2" />
              VXLANs
            </TabsTrigger>
            <TabsTrigger 
              value="tunnels"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Settings className="h-4 w-4 mr-2" />
              Tunnel Wizard
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="dashboard" className="space-y-6">
              <Dashboard />
            </TabsContent>

            <TabsContent value="vlans" className="space-y-6">
              <VLANManager />
            </TabsContent>

            <TabsContent value="vxlans" className="space-y-6">
              <VXLANManager />
            </TabsContent>

            <TabsContent value="tunnels" className="space-y-6">
              <TunnelWizard />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
