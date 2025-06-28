
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Settings, ArrowRight, CheckCircle, AlertTriangle, Zap } from "lucide-react";

const TunnelWizard = () => {
  const [step, setStep] = useState(1);
  const [tunnelConfig, setTunnelConfig] = useState({
    switchA: "",
    switchB: "", 
    vni: "",
    vtepA: "",
    vtepB: "",
    sessionA: "",
    sessionB: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [commitStatus, setCommitStatus] = useState<"idle" | "staging" | "committing" | "success" | "failed">("idle");

  const availableSwitches = [
    { id: "arista-leaf-01", name: "arista-leaf-01", status: "connected" },
    { id: "arista-leaf-02", name: "arista-leaf-02", status: "connected" },
    { id: "arista-spine-01", name: "arista-spine-01", status: "warning" }
  ];

  const suggestedVNIs = [20001, 20002, 20003, 20004, 20005];

  const handleCreateTunnel = async () => {
    setIsCreating(true);
    setCommitStatus("staging");
    setProgress(0);

    // Simulate two-phase commit process
    const phases = [
      { name: "Creating configuration sessions", progress: 20 },
      { name: "Staging configuration on Switch A", progress: 40 },
      { name: "Staging configuration on Switch B", progress: 60 },
      { name: "Validating configurations", progress: 80 },
      { name: "Committing to both switches", progress: 100 }
    ];

    for (const [index, phase] of phases.entries()) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(phase.progress);
      
      if (index === phases.length - 1) {
        setCommitStatus("success");
      }
    }

    setTimeout(() => {
      setIsCreating(false);
      setStep(1);
      setTunnelConfig({
        switchA: "",
        switchB: "", 
        vni: "",
        vtepA: "",
        vtepB: "",
        sessionA: "",
        sessionB: ""
      });
      setCommitStatus("idle");
      setProgress(0);
    }, 2000);
  };

  const generateSessionId = () => `tunnel-${Date.now()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">VXLAN Tunnel Wizard</h2>
          <p className="text-slate-400">Create point-to-point VXLAN tunnels with two-phase commit</p>
        </div>
        <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/50">
          <Zap className="h-3 w-3 mr-1" />
          Two-Phase Commit
        </Badge>
      </div>

      {/* Wizard Steps */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="h-5 w-5 mr-2 text-cyan-400" />
            Step {step} of 3
          </CardTitle>
          <Progress value={(step / 3) * 100} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Switches</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="switch-a">Switch A</Label>
                  <Select value={tunnelConfig.switchA} onValueChange={(value) => setTunnelConfig({ ...tunnelConfig, switchA: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select first switch" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableSwitches.map((sw) => (
                        <SelectItem key={sw.id} value={sw.id} disabled={sw.status !== "connected"}>
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-2 ${sw.status === "connected" ? "bg-green-400" : "bg-yellow-400"}`} />
                            {sw.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="switch-b">Switch B</Label>
                  <Select value={tunnelConfig.switchB} onValueChange={(value) => setTunnelConfig({ ...tunnelConfig, switchB: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select second switch" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableSwitches.filter(sw => sw.id !== tunnelConfig.switchA).map((sw) => (
                        <SelectItem key={sw.id} value={sw.id} disabled={sw.status !== "connected"}>
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-2 ${sw.status === "connected" ? "bg-green-400" : "bg-yellow-400"}`} />
                            {sw.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!tunnelConfig.switchA || !tunnelConfig.switchB}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Configure VNI and VTEPs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vni">VNI (VXLAN Network Identifier)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="vni"
                      type="number"
                      placeholder="e.g., 20001"
                      value={tunnelConfig.vni}
                      onChange={(e) => setTunnelConfig({ ...tunnelConfig, vni: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <Select onValueChange={(value) => setTunnelConfig({ ...tunnelConfig, vni: value })}>
                      <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {suggestedVNIs.map((vni) => (
                          <SelectItem key={vni} value={vni.toString()}>{vni}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Suggested Available VNIs</Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedVNIs.slice(0, 3).map((vni) => (
                      <Badge 
                        key={vni} 
                        className="bg-green-500/20 text-green-400 border-green-500/50 cursor-pointer"
                        onClick={() => setTunnelConfig({ ...tunnelConfig, vni: vni.toString() })}
                      >
                        {vni}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vtep-a">VTEP IP - {tunnelConfig.switchA}</Label>
                  <Input
                    id="vtep-a"
                    placeholder="e.g., 10.1.1.1"
                    value={tunnelConfig.vtepA}
                    onChange={(e) => setTunnelConfig({ ...tunnelConfig, vtepA: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="vtep-b">VTEP IP - {tunnelConfig.switchB}</Label>
                  <Input
                    id="vtep-b"
                    placeholder="e.g., 10.1.1.2"
                    value={tunnelConfig.vtepB}
                    onChange={(e) => setTunnelConfig({ ...tunnelConfig, vtepB: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    setTunnelConfig({
                      ...tunnelConfig,
                      sessionA: generateSessionId(),
                      sessionB: generateSessionId()
                    });
                    setStep(3);
                  }}
                  disabled={!tunnelConfig.vni || !tunnelConfig.vtepA || !tunnelConfig.vtepB}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Review & Execute Two-Phase Commit</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-400">Switch A Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-slate-400">Switch:</span> <span className="text-white font-mono">{tunnelConfig.switchA}</span></div>
                    <div><span className="text-slate-400">VTEP IP:</span> <span className="text-white font-mono">{tunnelConfig.vtepA}</span></div>
                    <div><span className="text-slate-400">Session:</span> <span className="text-cyan-400 font-mono">{tunnelConfig.sessionA}</span></div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-400">Switch B Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-slate-400">Switch:</span> <span className="text-white font-mono">{tunnelConfig.switchB}</span></div>
                    <div><span className="text-slate-400">VTEP IP:</span> <span className="text-white font-mono">{tunnelConfig.vtepB}</span></div>
                    <div><span className="text-slate-400">Session:</span> <span className="text-cyan-400 font-mono">{tunnelConfig.sessionB}</span></div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/50">
                <AlertTriangle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  VNI {tunnelConfig.vni} will be configured on both switches using application-level two-phase commit.
                  If any stage fails, all configurations will be rolled back automatically.
                </AlertDescription>
              </Alert>

              {isCreating && (
                <div className="space-y-4">
                  <Progress value={progress} className="w-full" />
                  <div className="text-center">
                    {commitStatus === "staging" && <span className="text-yellow-400">Staging configurations...</span>}
                    {commitStatus === "committing" && <span className="text-blue-400">Committing to switches...</span>}
                    {commitStatus === "success" && (
                      <div className="flex items-center justify-center text-green-400">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Tunnel created successfully!
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} disabled={isCreating}>
                  Back
                </Button>
                <Button 
                  onClick={handleCreateTunnel}
                  disabled={isCreating}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isCreating ? (
                    "Creating Tunnel..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Execute Two-Phase Commit
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TunnelWizard;
