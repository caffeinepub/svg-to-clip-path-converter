import { useState } from 'react';
import { Eye, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PreviewSectionProps {
  svgPath: string;
  clipPathPath: string;
  clipPathPolygon: string;
  pathError: string;
  polygonError: string;
}

export default function PreviewSection({ svgPath, clipPathPath, clipPathPolygon, pathError, polygonError }: PreviewSectionProps) {
  const [previewMode, setPreviewMode] = useState<'input' | 'output'>('input');
  const [outputFormat, setOutputFormat] = useState<'path' | 'polygon'>('path');

  const getClipPathStyle = (format: 'path' | 'polygon') => {
    const value = format === 'path' ? clipPathPath : clipPathPolygon;
    if (!value) return '';
    return value.replace('clip-path: ', '').replace(';', '');
  };

  const hasPathOutput = !!clipPathPath;
  const hasPolygonOutput = !!clipPathPolygon;
  const hasAnyOutput = hasPathOutput || hasPolygonOutput;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Live Preview
        </CardTitle>
        <CardDescription>
          See how your SVG path and clip-path look visually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'input' | 'output')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="input">Input Preview</TabsTrigger>
            <TabsTrigger value="output" disabled={!hasAnyOutput}>Output Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-4">
            <InputPreview svgPath={svgPath} />
          </TabsContent>
          
          <TabsContent value="output" className="space-y-4">
            {hasAnyOutput && (
              <>
                <Tabs value={outputFormat} onValueChange={(v) => setOutputFormat(v as 'path' | 'polygon')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="path" disabled={!hasPathOutput}>
                      Path Format
                    </TabsTrigger>
                    <TabsTrigger value="polygon" disabled={!hasPolygonOutput}>
                      Polygon Format
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="path" className="space-y-4">
                    {hasPathOutput ? (
                      <OutputPreview clipPath={getClipPathStyle('path')} />
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Path format preview is unavailable. {pathError || 'Conversion failed.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="polygon" className="space-y-4">
                    {hasPolygonOutput ? (
                      <OutputPreview clipPath={getClipPathStyle('polygon')} />
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Polygon format preview is unavailable. {polygonError || 'Conversion failed.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function InputPreview({ svgPath }: { svgPath: string }) {
  if (!svgPath.trim()) {
    return (
      <div className="relative bg-muted/30 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">
          Enter an SVG path to see the preview
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SVG Path Preview */}
      <div className="relative bg-muted/30 rounded-lg p-8 min-h-[300px] flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-full max-w-md h-auto"
          style={{ maxHeight: '400px' }}
        >
          <path
            d={svgPath}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            fillOpacity="0.8"
          />
        </svg>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Raw SVG path rendered in a 100×100 viewBox
      </p>
    </div>
  );
}

function OutputPreview({ clipPath }: { clipPath: string }) {
  // Guard against empty or invalid clip-path
  if (!clipPath || clipPath.trim() === '') {
    return (
      <div className="relative bg-muted/30 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">
          No preview available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="relative bg-muted/30 rounded-lg p-8 min-h-[300px] flex items-center justify-center overflow-hidden">
        <div className="relative w-full max-w-md aspect-[4/3]">
          <img
            src="/assets/generated/sample-image.dim_400x300.jpg"
            alt="Preview with clip-path applied"
            className="w-full h-full object-cover rounded-lg shadow-xl"
            style={{ clipPath }}
          />
        </div>
      </div>

      {/* Colored Div Preview */}
      <div className="relative bg-muted/30 rounded-lg p-8 min-h-[200px] flex items-center justify-center overflow-hidden">
        <div
          className="w-64 h-64 bg-gradient-to-br from-primary via-chart-1 to-chart-2 shadow-xl"
          style={{ clipPath }}
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        The clip-path is applied to both an image and a colored element
      </p>
    </div>
  );
}
