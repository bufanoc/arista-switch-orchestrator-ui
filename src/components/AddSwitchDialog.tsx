
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface AddSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchAdded?: (switchData: any) => void;
}

const AddSwitchDialog = ({ open, onOpenChange, onSwitchAdded }: AddSwitchDialogProps) => {
  const [formData, setFormData] = useState({
    hostname: "",
    mgmtIP: "",
    username: "",
    password: "",
    model: ""
  });
  const [testState, setTestState] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (testState !== "idle") {
      setTestState("idle");
      setIsConnected(false);
    }
  };

  const testConnection = async () => {
    if (!formData.hostname || !formData.mgmtIP || !formData.username || !formData.password) {
      setErrorMessage("Please fill in all required fields");
      setTestState("error");
      return;
    }

    setTestState("testing");
    setErrorMessage("");

    try {
      // Simulate API call to test switch connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success for demo - in real app this would call backend API
      const mockSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      if (mockSuccess) {
        setTestState("success");
        setIsConnected(true);
      } else {
        setTestState("error");
        setErrorMessage("Failed to connect: Authentication failed or switch unreachable");
      }
    } catch (error) {
      setTestState("error");
      setErrorMessage("Connection test failed: " + error.message);
    }
  };

  const handleSave = () => {
    if (!isConnected) {
      setErrorMessage("Please test connection successfully before saving");
      return;
    }

    const switchData = {
      id: Date.now(),
      hostname: formData.hostname,
      mgmtIP: formData.mgmtIP,
      model: formData.model || "Unknown",
      status: "connected",
      eosVersion: "4.29.2F", // Mock data - would come from switch
      uptime: "0d 0h 1m"     // Mock data - would come from switch
    };

    onSwitchAdded?.(switchData);
    
    // Reset form
    setFormData({
      hostname: "",
      mgmtIP: "",
      username: "",
      password: "",
      model: ""
    });
    setTestState("idle");
    setIsConnected(false);
    setErrorMessage("");
    onOpenChange(false);
  };

  const isFormValid = formData.hostname && formData.mgmtIP && formData.username && formData.password;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Switch</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="hostname">Hostname *</Label>
            <Input
              id="hostname"
              placeholder="e.g., arista-leaf-01"
              value={formData.hostname}
              onChange={(e) => handleInputChange("hostname", e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="mgmt-ip">Management IP *</Label>
            <Input
              id="mgmt-ip"
              placeholder="e.g., 192.168.1.101"
              value={formData.mgmtIP}
              onChange={(e) => handleInputChange("mgmtIP", e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="admin"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="model">Model (optional)</Label>
            <Input
              id="model"
              placeholder="e.g., DCS-7050SX3-48YC12"
              value={formData.model}
              onChange={(e) => handleInputChange("model", e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Connection Test Section */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Connection Test</Label>
              {testState === "success" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              {testState === "error" && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                  <XCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>
            
            <Button
              onClick={testConnection}
              disabled={!isFormValid || testState === "testing"}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {testState === "testing" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            
            {errorMessage && (
              <div className="flex items-center mt-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {errorMessage}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!isConnected}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Add Switch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSwitchDialog;
