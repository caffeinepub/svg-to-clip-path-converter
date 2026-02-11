import { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, AlertCircle, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InputSectionProps {
  onPathChange: (path: string) => void;
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  polygonQuality: 'low' | 'medium' | 'high';
  pathError: string;
  polygonError: string;
}

export default function InputSection({ 
  onPathChange, 
  onQualityChange,
  polygonQuality,
  pathError, 
  polygonError 
}: InputSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onPathChange(value);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid SVG file');
      }

      // Extract path data from the first path element
      const pathElement = doc.querySelector('path');
      if (!pathElement) {
        throw new Error('No path element found in SVG file');
      }

      const pathData = pathElement.getAttribute('d');
      if (!pathData) {
        throw new Error('Path element has no "d" attribute');
      }

      setInputValue(pathData);
      onPathChange(pathData);
    } catch (err) {
      onPathChange('');
      setInputValue('');
      alert(err instanceof Error ? err.message : 'Failed to read SVG file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const hasErrors = pathError || polygonError;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Input SVG Path
        </CardTitle>
        <CardDescription>
          Paste your SVG path data or upload an SVG file to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="paste">Paste Path</TabsTrigger>
            <TabsTrigger value="upload">Upload SVG</TabsTrigger>
          </TabsList>
          
          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="svg-input">SVG Path Data</Label>
              <Textarea
                id="svg-input"
                placeholder='Example: M 10 10 L 90 10 L 90 90 L 10 90 Z'
                value={inputValue}
                onChange={handleTextChange}
                className="font-mono text-sm min-h-[150px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Supports all SVG path commands (M, L, H, V, C, S, Q, T, A, Z)
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={handleUploadClick}
                variant="outline"
                className="w-full h-32 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload SVG file</span>
                  <span className="text-xs text-muted-foreground">or drag and drop</span>
                </div>
              </Button>
              {inputValue && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Extracted path:</p>
                  <p className="text-xs font-mono break-all">{inputValue.substring(0, 100)}...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Polygon Quality Control */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="quality-select" className="text-sm font-medium">
              Polygon Approximation Quality
            </Label>
          </div>
          <Select value={polygonQuality} onValueChange={(v) => onQualityChange(v as 'low' | 'medium' | 'high')}>
            <SelectTrigger id="quality-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (Faster, fewer points)</SelectItem>
              <SelectItem value="medium">Medium (Balanced)</SelectItem>
              <SelectItem value="high">High (Smoother, more points)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Controls how curves and arcs are approximated in polygon format. Higher quality produces smoother results but longer output.
          </p>
        </div>

        {hasErrors && (
          <div className="mt-4 space-y-2">
            {pathError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Path Format:</strong> {pathError}
                </AlertDescription>
              </Alert>
            )}
            {polygonError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Polygon Format:</strong> {polygonError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
