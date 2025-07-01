
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Loader2, Server } from "lucide-react";
import { SwitchesAPI, Switch } from "@/lib/api-client";
import { toast } from "sonner";

// Note: Using the Switch interface from api-client.ts

interface AddSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchAdded: (newSwitch: Switch) => void;
}

const AddSwitchDialog = ({ open, onOpenChange, onSwitchAdded }: AddSwitchDialogProps) => {
  const [formData, setFormData] = useState({
    hostname: "",
    mgmtIP: "",
    username: "",
    password: "",
    model: ""
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [connectionError, setConnectionError] = useState("");
  const [switchInfo, setSwitchInfo] = useState<Partial<Switch> | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Reset connection status when form changes
    if (connectionStatus !== "idle") {
      setConnectionStatus("idle");
      setSwitchInfo(null);
      setConnectionError("");
    }
  };

  const testConnection = async () => {
    if (!formData.hostname || !formData.mgmtIP || !formData.username || !formData.password) {
      setConnectionError("Please fill in all required fields");
      return;
    }

    setIsConnecting(true);
    setConnectionStatus("testing");
    setConnectionError("");

    try {
      // Use the real API to test connection
      const result = await SwitchesAPI.testConnection({
        hostname: formData.hostname,
        mgmtIP: formData.mgmtIP,
        username: formData.username,
        password: formData.password
      });
      
      if (result.connected) {
        // Connection successful
        setSwitchInfo({
          hostname: formData.hostname,
          mgmtIP: formData.mgmtIP,
          model: result.model || formData.model,
          eosVersion: result.eosVersion,
          // Uptime might not be present in the API response
          uptime: result.uptime || 'Unknown'
        });
        setConnectionStatus("success");
        toast.success("Successfully connected to switch");
      } else {
        // Connection failed
        setConnectionStatus("failed");
        setConnectionError(result.error || "Failed to connect to switch");
        toast.error("Failed to connect to switch");
      }
    } catch (error) {
      setConnectionStatus("failed");
      const errorMsg = error instanceof Error ? error.message : "Failed to connect to switch. Please check credentials and network connectivity.";
      setConnectionError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = async () => {
    if (connectionStatus !== "success" || !switchInfo) {
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Add the switch using the API
      const addedSwitch = await SwitchesAPI.addSwitch({
        hostname: formData.hostname,
        mgmtIP: formData.mgmtIP,
        username: formData.username,
        password: formData.password,
        model: formData.model || switchInfo.model
      });
      
      // Notify the parent component
      onSwitchAdded(addedSwitch);
      toast.success(`Added switch ${addedSwitch.hostname}`);
      
      // Reset form
      setFormData({ hostname: "", mgmtIP: "", username: "", password: "", model: "" });
      setConnectionStatus("idle");
      setSwitchInfo(null);
      setConnectionError("");
      onOpenChange(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add switch";
      toast.error(errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-cyan-400" />
            Add Arista Switch
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hostname">Hostname *</Label>
              <Input
                id="hostname"
                placeholder="e.g., leaf-01"
                value={formData.hostname}
                onChange={(e) => handleInputChange("hostname", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="mgmt-ip">Management IP *</Label>
              <Input
                id="mgmt-ip"
                placeholder="e.g., 192.168.1.10"
                value={formData.mgmtIP}
                onChange={(e) => handleInputChange("mgmtIP", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="e.g., admin"
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
            <Label htmlFor="model">Model (Optional)</Label>
            <Input
              id="model"
              placeholder="e.g., DCS-7050SX3-48YC8"
              value={formData.model}
              onChange={(e) => handleInputChange("model", e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Connection Status */}
          {connectionStatus === "testing" && (
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              <AlertDescription className="text-blue-300">
                Testing eAPI connection to {formData.mgmtIP}...
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === "success" && switchInfo && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <div className="space-y-1">
                  <div>Connection successful! Switch details:</div>
                  <div className="text-sm space-y-1 mt-2">
                    <div>Model: <span className="font-mono">{switchInfo.model}</span></div>
                    <div>EOS Version: <span className="font-mono">{switchInfo.eosVersion}</span></div>
                    <div>Uptime: <span className="font-mono">{switchInfo.uptime}</span></div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === "failed" && (
            <Alert className="bg-red-500/10 border-red-500/50">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={testConnection}
                disabled={isConnecting || !formData.hostname || !formData.mgmtIP || !formData.username || !formData.password}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={connectionStatus !== "success"}
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Switch
              </Button>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            * Required fields. Connection test must pass before saving.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSwitchDialog;
