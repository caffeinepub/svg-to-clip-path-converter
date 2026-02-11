import { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OutputSectionProps {
  clipPathPath: string;
  clipPathPolygon: string;
}

export default function OutputSection({ clipPathPath, clipPathPolygon }: OutputSectionProps) {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedPolygon, setCopiedPolygon] = useState(false);

  const handleCopy = async (text: string, type: 'path' | 'polygon') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'path') {
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
      } else {
        setCopiedPolygon(true);
        setTimeout(() => setCopiedPolygon(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          Converted Output
        </CardTitle>
        <CardDescription>
          Copy the generated CSS clip-path values for use in your stylesheets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="path" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="path">Path Format</TabsTrigger>
            <TabsTrigger value="polygon">Polygon Format</TabsTrigger>
          </TabsList>
          
          <TabsContent value="path" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="path-output">clip-path: path()</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(clipPathPath, 'path')}
                  className="h-8"
                >
                  {copiedPath ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="path-output"
                value={clipPathPath}
                readOnly
                className="font-mono text-sm min-h-[150px] resize-y bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Modern browsers support the path() function for complex shapes
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="polygon" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="polygon-output">clip-path: polygon()</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(clipPathPolygon, 'polygon')}
                  className="h-8"
                >
                  {copiedPolygon ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="polygon-output"
                value={clipPathPolygon}
                readOnly
                className="font-mono text-sm min-h-[150px] resize-y bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Polygon format has wider browser support but works best with straight edges
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
