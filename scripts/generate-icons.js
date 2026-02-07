/**
 * Generate PWA Icons Script
 * Run with Node.js to generate all icon sizes from the SVG
 */

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs/promises';
import path from 'path';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const svgPath = './public/favicon.svg';
  const outputDir = './public';
  
  try {
    const svgBuffer = await fs.readFile(svgPath);
    
    for (const size of SIZES) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Load SVG and draw
      const img = await loadImage(`data:image/svg+xml;base64,${svgBuffer.toString('base64')}`);
      ctx.drawImage(img, 0, 0, size, size);
      
      // Save PNG
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(path.join(outputDir, `icon-${size}x${size}.png`), buffer);
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIcons();
}

export { generateIcons, SIZES };
