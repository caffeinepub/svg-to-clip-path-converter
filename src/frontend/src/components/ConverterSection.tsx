import { useState, useCallback } from 'react';
import InputSection from './InputSection';
import OutputSection from './OutputSection';
import PreviewSection from './PreviewSection';
import { convertSvgPathToClipPath, convertSvgPathToPolygon } from '../lib/pathConverter';

export default function ConverterSection() {
  const [svgPath, setSvgPath] = useState('');
  const [clipPathPath, setClipPathPath] = useState('');
  const [clipPathPolygon, setClipPathPolygon] = useState('');
  const [pathError, setPathError] = useState('');
  const [polygonError, setPolygonError] = useState('');
  const [polygonQuality, setPolygonQuality] = useState<'low' | 'medium' | 'high'>('medium');

  const convertPath = useCallback((path: string, quality: 'low' | 'medium' | 'high') => {
    if (!path.trim()) {
      setClipPathPath('');
      setClipPathPolygon('');
      setPathError('');
      setPolygonError('');
      return;
    }

    // Try path conversion
    try {
      const pathResult = convertSvgPathToClipPath(path);
      setClipPathPath(pathResult);
      setPathError('');
    } catch (err) {
      setPathError(err instanceof Error ? err.message : 'Invalid SVG path');
      setClipPathPath('');
    }

    // Try polygon conversion independently with quality settings
    try {
      const qualityMap = {
        low: { curveSegments: 4, arcSegments: 8 },
        medium: { curveSegments: 8, arcSegments: 16 },
        high: { curveSegments: 16, arcSegments: 32 }
      };
      
      const polygonResult = convertSvgPathToPolygon(path, qualityMap[quality]);
      setClipPathPolygon(polygonResult);
      setPolygonError('');
    } catch (err) {
      setPolygonError(err instanceof Error ? err.message : 'Failed to convert to polygon');
      setClipPathPolygon('');
    }
  }, []);

  const handlePathChange = useCallback((path: string) => {
    setSvgPath(path);
    convertPath(path, polygonQuality);
  }, [polygonQuality, convertPath]);

  const handleQualityChange = useCallback((quality: 'low' | 'medium' | 'high') => {
    setPolygonQuality(quality);
    // Recompute polygon with new quality if we have a path
    if (svgPath.trim()) {
      convertPath(svgPath, quality);
    }
  }, [svgPath, convertPath]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Input Section */}
        <InputSection 
          onPathChange={handlePathChange}
          onQualityChange={handleQualityChange}
          polygonQuality={polygonQuality}
          pathError={pathError}
          polygonError={polygonError}
        />

        {/* Output and Preview Grid */}
        {svgPath && (
          <div className="grid lg:grid-cols-2 gap-8">
            {(clipPathPath || clipPathPolygon) && (
              <OutputSection 
                clipPathPath={clipPathPath}
                clipPathPolygon={clipPathPolygon}
                pathError={pathError}
                polygonError={polygonError}
              />
            )}
            <PreviewSection 
              svgPath={svgPath}
              clipPathPath={clipPathPath}
              clipPathPolygon={clipPathPolygon}
              pathError={pathError}
              polygonError={polygonError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
