
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Wifi } from "lucide-react";

interface AddSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SwitchFormData {
  hostname: string;
  mgmtIP: string;
  username: string;
  password: string;
  model?: string;
}

const AddSwitchDialog = ({ open, onOpenChange }: AddSwitchDialogProps) => {
  const [formData, setFormData] = useState<SwitchFormData>({
    hostname: '',
    mgmtIP: '',
    username: '',
    password: '',
    model: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof SwitchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (connectionStatus !== 'idle') {
      setConnectionStatus('idle');
      setErrorMessage('');
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      // Simulate API call to test eAPI connection
      const response = await fetch('/api/switches/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: formData.hostname,
          mgmtIP: formData.mgmtIP,
          username: formData.username,
          password: formData.password
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConnectionStatus('success');
        } else {
          setConnectionStatus('error');
          setErrorMessage(result.error || 'Connection test failed');
        }
      } else {
        setConnectionStatus('error');
        setErrorMessage('Failed to connect to switch. Please check credentials and network connectivity.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage('Network error occurred while testing connection');
    }
  };

  const handleSave = async () => {
    if (connectionStatus !== 'success') {
      setErrorMessage('Please test the connection successfully before saving');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call to save switch
      const response = await fetch('/api/switches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Reset form and close dialog
        setFormData({
          hostname: '',
          mgmtIP: '',
          username: '',
          password: '',
          model: ''
        });
        setConnectionStatus('idle');
        setErrorMessage('');
        onOpenChange(false);
        // TODO: Refresh switch list
      } else {
        setErrorMessage('Failed to save switch configuration');
      }
    } catch (error) {
      setErrorMessage('Error saving switch configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.hostname && formData.mgmtIP && formData.username && formData.password;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Wifi className="h-5 w-5 mr-2 text-cyan-400" />
            Add New Switch
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostname" className="text-slate-300">Hostname *</Label>
            <Input
              id="hostname"
              value={formData.hostname}
              onChange={(e) => handleInputChange('hostname', e.target.value)}
              placeholder="arista-leaf-01"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mgmtIP" className="text-slate-300">Management IP *</Label>
            <Input
              id="mgmtIP"
              value={formData.mgmtIP}
              onChange={(e) => handleInputChange('mgmtIP', e.target.value)}
              placeholder="192.168.1.101"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="admin"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className="text-slate-300">Model (Optional)</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="DCS-7050SX3-48YC12"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {connectionStatus === 'testing' && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </Badge>
              )}
              {connectionStatus === 'success' && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              {connectionStatus === 'error' && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>
            <Button
              onClick={testConnection}
              disabled={!isFormValid || connectionStatus === 'testing'}
              variant="outline"
              size="sm"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
            >
              {connectionStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/50">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={connectionStatus !== 'success' || isSaving}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Switch'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSwitchDialog;
