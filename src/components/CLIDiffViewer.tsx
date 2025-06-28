
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus } from "lucide-react";

interface CLIDiffViewerProps {
  config: string;
}

const CLIDiffViewer = ({ config }: CLIDiffViewerProps) => {
  const lines = config.split('\n');

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-cyan-400" />
            Configuration Preview
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            <Plus className="h-3 w-3 mr-1" />
            Addition
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <pre className="text-sm font-mono text-slate-200 overflow-x-auto">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span className="text-slate-500 w-8 text-right mr-4 select-none">
                  {index + 1}
                </span>
                <span className={`${
                  line.startsWith('!') 
                    ? 'text-slate-500' 
                    : line.trim().length === 0
                    ? ''
                    : 'text-green-400'
                }`}>
                  {line.startsWith('!') && (
                    <span className="text-slate-500 mr-1">!</span>
                  )}
                  {line.replace(/^!/, '')}
                </span>
              </div>
            ))}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default CLIDiffViewer;
