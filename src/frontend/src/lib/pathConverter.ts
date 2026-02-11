/**
 * Converts an SVG path to CSS clip-path path() format
 */
export function convertSvgPathToClipPath(svgPath: string): string {
  if (!svgPath || !svgPath.trim()) {
    throw new Error('SVG path cannot be empty');
  }

  // Clean up the path
  const cleanPath = svgPath.trim();
  
  // Validate that it looks like an SVG path
  if (!isValidSvgPath(cleanPath)) {
    throw new Error('Invalid SVG path format');
  }

  // For clip-path path(), we need to use the 'nonzero' fill rule
  return `clip-path: path('${cleanPath}');`;
}

/**
 * Converts an SVG path to CSS clip-path polygon() format
 * Note: This is a simplified conversion that works best with paths made of straight lines
 */
export function convertSvgPathToPolygon(svgPath: string): string {
  if (!svgPath || !svgPath.trim()) {
    throw new Error('SVG path cannot be empty');
  }

  const cleanPath = svgPath.trim();
  
  if (!isValidSvgPath(cleanPath)) {
    throw new Error('Invalid SVG path format');
  }

  try {
    const points = extractPointsFromPath(cleanPath);
    
    if (points.length < 3) {
      throw new Error('Path must contain at least 3 points to create a polygon');
    }

    // Convert points to percentage-based coordinates
    const polygonPoints = points
      .map(point => `${point.x}% ${point.y}%`)
      .join(', ');

    return `clip-path: polygon(${polygonPoints});`;
  } catch (err) {
    throw new Error('Failed to convert path to polygon: ' + (err instanceof Error ? err.message : 'Unknown error'));
  }
}

/**
 * Validates if a string looks like a valid SVG path
 */
function isValidSvgPath(path: string): boolean {
  // Check for common SVG path commands
  const pathCommandRegex = /[MmLlHhVvCcSsQqTtAaZz]/;
  return pathCommandRegex.test(path);
}

/**
 * Extracts coordinate points from an SVG path
 * This is a simplified parser that handles basic path commands
 */
function extractPointsFromPath(path: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  
  // Remove extra whitespace and normalize
  const normalized = path
    .replace(/,/g, ' ')
    .replace(/([MmLlHhVvCcSsQqTtAaZz])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = normalized.split(' ').filter(t => t.length > 0);
  
  let currentX = 0;
  let currentY = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  const absolutePoints: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    switch (token) {
      case 'M': // Move to (absolute)
        currentX = parseFloat(tokens[++i]);
        currentY = parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'm': // Move to (relative)
        currentX += parseFloat(tokens[++i]);
        currentY += parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'L': // Line to (absolute)
        currentX = parseFloat(tokens[++i]);
        currentY = parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'l': // Line to (relative)
        currentX += parseFloat(tokens[++i]);
        currentY += parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'H': // Horizontal line (absolute)
        currentX = parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'h': // Horizontal line (relative)
        currentX += parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'V': // Vertical line (absolute)
        currentY = parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'v': // Vertical line (relative)
        currentY += parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'C': // Cubic Bezier (absolute) - use end point
        i += 4; // Skip control points
        currentX = parseFloat(tokens[i]);
        currentY = parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'c': // Cubic Bezier (relative) - use end point
        i += 4; // Skip control points
        currentX += parseFloat(tokens[i]);
        currentY += parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'Q': // Quadratic Bezier (absolute) - use end point
        i += 2; // Skip control point
        currentX = parseFloat(tokens[i]);
        currentY = parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'q': // Quadratic Bezier (relative) - use end point
        i += 2; // Skip control point
        currentX += parseFloat(tokens[i]);
        currentY += parseFloat(tokens[++i]);
        absolutePoints.push({ x: currentX, y: currentY });
        break;
        
      case 'Z':
      case 'z':
        // Close path - no action needed
        break;
    }
  }

  // Find bounding box
  absolutePoints.forEach(point => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  // Normalize to percentages (0-100)
  absolutePoints.forEach(point => {
    const normalizedX = width > 0 ? ((point.x - minX) / width) * 100 : 50;
    const normalizedY = height > 0 ? ((point.y - minY) / height) * 100 : 50;
    points.push({ 
      x: Math.round(normalizedX * 100) / 100, 
      y: Math.round(normalizedY * 100) / 100 
    });
  });

  return points;
}
