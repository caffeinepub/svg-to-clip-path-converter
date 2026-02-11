import { useState, useCallback } from 'react';
import InputSection from './InputSection';
import OutputSection from './OutputSection';
import PreviewSection from './PreviewSection';
import { convertSvgPathToClipPath, convertSvgPathToPolygon } from '../lib/pathConverter';

export default function ConverterSection() {
  const [svgPath, setSvgPath] = useState('');
  const [clipPathPath, setClipPathPath] = useState('');
  const [clipPathPolygon, setClipPathPolygon] = useState('');
  const [error, setError] = useState('');

  const handlePathChange = useCallback((path: string) => {
    setSvgPath(path);
    setError('');

    if (!path.trim()) {
      setClipPathPath('');
      setClipPathPolygon('');
      return;
    }

    try {
      const pathResult = convertSvgPathToClipPath(path);
      const polygonResult = convertSvgPathToPolygon(path);
      
      setClipPathPath(pathResult);
      setClipPathPolygon(polygonResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid SVG path');
      setClipPathPath('');
      setClipPathPolygon('');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Input Section */}
        <InputSection onPathChange={handlePathChange} error={error} />

        {/* Output and Preview Grid */}
        {svgPath && (
          <div className="grid lg:grid-cols-2 gap-8">
            {(clipPathPath || clipPathPolygon) && (
              <OutputSection 
                clipPathPath={clipPathPath}
                clipPathPolygon={clipPathPolygon}
              />
            )}
            <PreviewSection 
              svgPath={svgPath}
              clipPathPath={clipPathPath}
              clipPathPolygon={clipPathPolygon}
            />
          </div>
        )}
      </div>
    </div>
  );
}
