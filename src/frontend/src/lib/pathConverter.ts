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
 * Options for polygon conversion
 */
export interface PolygonConversionOptions {
  /** Number of segments to use when approximating curves (default: 8) */
  curveSegments?: number;
  /** Number of segments to use when approximating arcs (default: 16) */
  arcSegments?: number;
}

/**
 * Converts an SVG path to CSS clip-path polygon() format
 * Supports all SVG path commands with curve/arc flattening
 */
export function convertSvgPathToPolygon(
  svgPath: string,
  options: PolygonConversionOptions = {}
): string {
  if (!svgPath || !svgPath.trim()) {
    throw new Error('SVG path cannot be empty');
  }

  const cleanPath = svgPath.trim();
  
  if (!isValidSvgPath(cleanPath)) {
    throw new Error('Invalid SVG path format');
  }

  try {
    const points = extractPointsFromPath(cleanPath, options);
    
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
 * Token types for SVG path parsing
 */
type Token = 
  | { type: 'command'; value: string }
  | { type: 'number'; value: number };

/**
 * Tokenizes an SVG path string into commands and numbers
 * Handles all SVG number formats: -10, -.5, 10.5, 1e-3, etc.
 */
function tokenizePath(path: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < path.length) {
    const char = path[i];
    
    // Skip whitespace and commas
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === ',') {
      i++;
      continue;
    }
    
    // Check if it's a command letter
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(char)) {
      tokens.push({ type: 'command', value: char });
      i++;
      continue;
    }
    
    // Try to parse a number
    if (/[0-9+\-.]/.test(char)) {
      let numStr = '';
      let hasDecimal = false;
      let hasExponent = false;
      
      // Handle sign
      if (char === '+' || char === '-') {
        numStr += char;
        i++;
      }
      
      // Parse digits, decimal point, and exponent
      while (i < path.length) {
        const c = path[i];
        
        if (/[0-9]/.test(c)) {
          numStr += c;
          i++;
        } else if (c === '.' && !hasDecimal && !hasExponent) {
          numStr += c;
          hasDecimal = true;
          i++;
        } else if ((c === 'e' || c === 'E') && !hasExponent && numStr.length > 0) {
          numStr += c;
          hasExponent = true;
          i++;
          // Handle exponent sign
          if (i < path.length && (path[i] === '+' || path[i] === '-')) {
            numStr += path[i];
            i++;
          }
        } else {
          break;
        }
      }
      
      // Validate and convert to number
      if (numStr === '' || numStr === '.' || numStr === '-' || numStr === '+' || 
          numStr === '-.' || numStr === '+.' || /[eE]$/.test(numStr)) {
        throw new Error(`Invalid number format: "${numStr}"`);
      }
      
      const num = parseFloat(numStr);
      if (isNaN(num)) {
        throw new Error(`Invalid numeric value: "${numStr}"`);
      }
      
      tokens.push({ type: 'number', value: num });
      continue;
    }
    
    // Unknown character
    throw new Error(`Unexpected character "${char}" at position ${i}`);
  }
  
  return tokens;
}

/**
 * Extracts coordinate points from an SVG path with curve/arc flattening
 */
function extractPointsFromPath(
  path: string,
  options: PolygonConversionOptions = {}
): Array<{ x: number; y: number }> {
  const curveSegments = options.curveSegments ?? 8;
  const arcSegments = options.arcSegments ?? 16;
  
  const tokens = tokenizePath(path);
  const absolutePoints: Array<{ x: number; y: number }> = [];
  
  let currentX = 0;
  let currentY = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let lastCommand = '';
  
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (token.type !== 'command') {
      throw new Error(`Expected command, got number at token ${i}`);
    }
    
    const command = token.value;
    i++;
    
    // Helper to get next number
    const getNumber = (context: string): number => {
      if (i >= tokens.length || tokens[i].type !== 'number') {
        throw new Error(`Expected number for ${context}`);
      }
      return (tokens[i++] as { type: 'number'; value: number }).value;
    };
    
    // Process command (may repeat for coordinate pairs)
    let isFirstCoordSet = true;
    
    do {
      const startIndex = i;
      
      try {
        switch (command) {
          case 'M': { // Move to (absolute)
            currentX = getNumber('M command x-coordinate');
            currentY = getNumber('M command y-coordinate');
            if (isFirstCoordSet) {
              subpathStartX = currentX;
              subpathStartY = currentY;
            }
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'm': { // Move to (relative)
            const dx = getNumber('m command x-coordinate');
            const dy = getNumber('m command y-coordinate');
            currentX += dx;
            currentY += dy;
            if (isFirstCoordSet) {
              subpathStartX = currentX;
              subpathStartY = currentY;
            }
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'L': { // Line to (absolute)
            currentX = getNumber('L command x-coordinate');
            currentY = getNumber('L command y-coordinate');
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'l': { // Line to (relative)
            currentX += getNumber('l command x-coordinate');
            currentY += getNumber('l command y-coordinate');
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'H': { // Horizontal line (absolute)
            currentX = getNumber('H command x-coordinate');
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'h': { // Horizontal line (relative)
            currentX += getNumber('h command x-coordinate');
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'V': { // Vertical line (absolute)
            currentY = getNumber('V command y-coordinate');
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'v': { // Vertical line (relative)
            currentY += getNumber('v command y-coordinate');
            absolutePoints.push({ x: currentX, y: currentY });
            break;
          }
          
          case 'C': { // Cubic Bezier (absolute)
            const x1 = getNumber('C command control point 1 x');
            const y1 = getNumber('C command control point 1 y');
            const x2 = getNumber('C command control point 2 x');
            const y2 = getNumber('C command control point 2 y');
            const x = getNumber('C command end x');
            const y = getNumber('C command end y');
            
            // Flatten cubic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = cubicBezier(currentX, currentY, x1, y1, x2, y2, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x2;
            lastControlY = y2;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'c': { // Cubic Bezier (relative)
            const dx1 = getNumber('c command control point 1 x');
            const dy1 = getNumber('c command control point 1 y');
            const dx2 = getNumber('c command control point 2 x');
            const dy2 = getNumber('c command control point 2 y');
            const dx = getNumber('c command end x');
            const dy = getNumber('c command end y');
            
            const x1 = currentX + dx1;
            const y1 = currentY + dy1;
            const x2 = currentX + dx2;
            const y2 = currentY + dy2;
            const x = currentX + dx;
            const y = currentY + dy;
            
            // Flatten cubic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = cubicBezier(currentX, currentY, x1, y1, x2, y2, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x2;
            lastControlY = y2;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'S': { // Smooth cubic Bezier (absolute)
            const x2 = getNumber('S command control point 2 x');
            const y2 = getNumber('S command control point 2 y');
            const x = getNumber('S command end x');
            const y = getNumber('S command end y');
            
            // Reflect previous control point
            const x1 = (lastCommand === 'C' || lastCommand === 'c' || lastCommand === 'S' || lastCommand === 's')
              ? 2 * currentX - lastControlX
              : currentX;
            const y1 = (lastCommand === 'C' || lastCommand === 'c' || lastCommand === 'S' || lastCommand === 's')
              ? 2 * currentY - lastControlY
              : currentY;
            
            // Flatten cubic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = cubicBezier(currentX, currentY, x1, y1, x2, y2, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x2;
            lastControlY = y2;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 's': { // Smooth cubic Bezier (relative)
            const dx2 = getNumber('s command control point 2 x');
            const dy2 = getNumber('s command control point 2 y');
            const dx = getNumber('s command end x');
            const dy = getNumber('s command end y');
            
            // Reflect previous control point
            const x1 = (lastCommand === 'C' || lastCommand === 'c' || lastCommand === 'S' || lastCommand === 's')
              ? 2 * currentX - lastControlX
              : currentX;
            const y1 = (lastCommand === 'C' || lastCommand === 'c' || lastCommand === 'S' || lastCommand === 's')
              ? 2 * currentY - lastControlY
              : currentY;
            
            const x2 = currentX + dx2;
            const y2 = currentY + dy2;
            const x = currentX + dx;
            const y = currentY + dy;
            
            // Flatten cubic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = cubicBezier(currentX, currentY, x1, y1, x2, y2, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x2;
            lastControlY = y2;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'Q': { // Quadratic Bezier (absolute)
            const x1 = getNumber('Q command control point x');
            const y1 = getNumber('Q command control point y');
            const x = getNumber('Q command end x');
            const y = getNumber('Q command end y');
            
            // Flatten quadratic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = quadraticBezier(currentX, currentY, x1, y1, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x1;
            lastControlY = y1;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'q': { // Quadratic Bezier (relative)
            const dx1 = getNumber('q command control point x');
            const dy1 = getNumber('q command control point y');
            const dx = getNumber('q command end x');
            const dy = getNumber('q command end y');
            
            const x1 = currentX + dx1;
            const y1 = currentY + dy1;
            const x = currentX + dx;
            const y = currentY + dy;
            
            // Flatten quadratic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = quadraticBezier(currentX, currentY, x1, y1, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x1;
            lastControlY = y1;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'T': { // Smooth quadratic Bezier (absolute)
            const x = getNumber('T command end x');
            const y = getNumber('T command end y');
            
            // Reflect previous control point
            const x1 = (lastCommand === 'Q' || lastCommand === 'q' || lastCommand === 'T' || lastCommand === 't')
              ? 2 * currentX - lastControlX
              : currentX;
            const y1 = (lastCommand === 'Q' || lastCommand === 'q' || lastCommand === 'T' || lastCommand === 't')
              ? 2 * currentY - lastControlY
              : currentY;
            
            // Flatten quadratic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = quadraticBezier(currentX, currentY, x1, y1, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x1;
            lastControlY = y1;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 't': { // Smooth quadratic Bezier (relative)
            const dx = getNumber('t command end x');
            const dy = getNumber('t command end y');
            
            // Reflect previous control point
            const x1 = (lastCommand === 'Q' || lastCommand === 'q' || lastCommand === 'T' || lastCommand === 't')
              ? 2 * currentX - lastControlX
              : currentX;
            const y1 = (lastCommand === 'Q' || lastCommand === 'q' || lastCommand === 'T' || lastCommand === 't')
              ? 2 * currentY - lastControlY
              : currentY;
            
            const x = currentX + dx;
            const y = currentY + dy;
            
            // Flatten quadratic bezier curve
            for (let t = 1; t <= curveSegments; t++) {
              const ratio = t / curveSegments;
              const point = quadraticBezier(currentX, currentY, x1, y1, x, y, ratio);
              absolutePoints.push(point);
            }
            
            lastControlX = x1;
            lastControlY = y1;
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'A': { // Arc (absolute)
            const rx = getNumber('A command rx');
            const ry = getNumber('A command ry');
            const xAxisRotation = getNumber('A command x-axis-rotation');
            const largeArcFlag = getNumber('A command large-arc-flag');
            const sweepFlag = getNumber('A command sweep-flag');
            const x = getNumber('A command end x');
            const y = getNumber('A command end y');
            
            // Approximate arc with line segments
            const arcPoints = approximateArc(
              currentX, currentY, rx, ry, xAxisRotation,
              largeArcFlag !== 0, sweepFlag !== 0, x, y, arcSegments
            );
            absolutePoints.push(...arcPoints);
            
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'a': { // Arc (relative)
            const rx = getNumber('a command rx');
            const ry = getNumber('a command ry');
            const xAxisRotation = getNumber('a command x-axis-rotation');
            const largeArcFlag = getNumber('a command large-arc-flag');
            const sweepFlag = getNumber('a command sweep-flag');
            const dx = getNumber('a command end x');
            const dy = getNumber('a command end y');
            
            const x = currentX + dx;
            const y = currentY + dy;
            
            // Approximate arc with line segments
            const arcPoints = approximateArc(
              currentX, currentY, rx, ry, xAxisRotation,
              largeArcFlag !== 0, sweepFlag !== 0, x, y, arcSegments
            );
            absolutePoints.push(...arcPoints);
            
            currentX = x;
            currentY = y;
            break;
          }
          
          case 'Z':
          case 'z': {
            // Close path - return to subpath start
            if (currentX !== subpathStartX || currentY !== subpathStartY) {
              absolutePoints.push({ x: subpathStartX, y: subpathStartY });
              currentX = subpathStartX;
              currentY = subpathStartY;
            }
            break;
          }
          
          default:
            throw new Error(`Unsupported command: ${command}`);
        }
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`Error processing ${command} command`);
      }
      
      lastCommand = command;
      isFirstCoordSet = false;
      
      // Check if there are more coordinate pairs for this command
      // (M/m after first pair becomes L/l)
      if ((command === 'M' || command === 'm') && !isFirstCoordSet) {
        // Implicit lineto after moveto - continue with L/l behavior
        continue;
      }
      
      // For other commands, check if next token is a number (coordinate pair continues)
      if (i < tokens.length && tokens[i].type === 'number') {
        // More coordinates for this command
        continue;
      }
      
      break; // No more coordinates, move to next command
      
    } while (true);
  }
  
  if (absolutePoints.length === 0) {
    throw new Error('No points extracted from path');
  }
  
  // Find bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  absolutePoints.forEach(point => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Normalize to percentages (0-100)
  const normalizedPoints: Array<{ x: number; y: number }> = [];
  absolutePoints.forEach(point => {
    const normalizedX = width > 0 ? ((point.x - minX) / width) * 100 : 50;
    const normalizedY = height > 0 ? ((point.y - minY) / height) * 100 : 50;
    normalizedPoints.push({ 
      x: Math.round(normalizedX * 100) / 100, 
      y: Math.round(normalizedY * 100) / 100 
    });
  });
  
  return normalizedPoints;
}

/**
 * Cubic Bezier curve evaluation
 */
function cubicBezier(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  
  return {
    x: mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3,
    y: mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3
  };
}

/**
 * Quadratic Bezier curve evaluation
 */
function quadraticBezier(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  
  return {
    x: mt2 * x0 + 2 * mt * t * x1 + t2 * x2,
    y: mt2 * y0 + 2 * mt * t * y1 + t2 * y2
  };
}

/**
 * Approximate an elliptical arc with line segments
 */
function approximateArc(
  x1: number, y1: number,
  rx: number, ry: number,
  xAxisRotation: number,
  largeArcFlag: boolean,
  sweepFlag: boolean,
  x2: number, y2: number,
  segments: number
): Array<{ x: number; y: number }> {
  // Handle degenerate cases
  if (rx === 0 || ry === 0) {
    return [{ x: x2, y: y2 }];
  }
  
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  
  const phi = (xAxisRotation * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  
  // Compute center point
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;
  
  // Correct radii if needed
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  
  const sq = Math.max(0, (rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p) /
    (rx * rx * y1p * y1p + ry * ry * x1p * x1p));
  const sign = largeArcFlag !== sweepFlag ? 1 : -1;
  const cxp = sign * Math.sqrt(sq) * (rx * y1p) / ry;
  const cyp = sign * Math.sqrt(sq) * -(ry * x1p) / rx;
  
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
  
  // Compute angles
  const theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
  const theta2 = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx);
  
  let dTheta = theta2 - theta1;
  if (sweepFlag && dTheta < 0) {
    dTheta += 2 * Math.PI;
  } else if (!sweepFlag && dTheta > 0) {
    dTheta -= 2 * Math.PI;
  }
  
  // Generate points
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const theta = theta1 + t * dTheta;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    
    const x = cosPhi * rx * cosTheta - sinPhi * ry * sinTheta + cx;
    const y = sinPhi * rx * cosTheta + cosPhi * ry * sinTheta + cy;
    
    points.push({ x, y });
  }
  
  return points;
}
