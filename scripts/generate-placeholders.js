/**
 * Simple Icon Generator (No external dependencies)
 * Creates basic PWA icons as simple colored PNG-like files
 * Replace with proper icons before production!
 */

import fs from 'fs/promises';
import path from 'path';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple 1x1 blue PNG (Base64 encoded) that will be stretched
// This is a placeholder - replace with real icons!
const BLUE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function generatePlaceholderIcons() {
  const outputDir = './public';
  
  console.log('Generating placeholder PWA icons...');
  console.log('⚠️  Replace these with real icons before production!\n');
  
  for (const size of SIZES) {
    // For now, just copy the placeholder to each file
    // In production, use a proper image generation tool
    await fs.writeFile(
      path.join(outputDir, `icon-${size}x${size}.png`),
      BLUE_PIXEL_PNG
    );
    console.log(`✓ Created icon-${size}x${size}.png (placeholder)`);
  }
  
  console.log('\n📦 All placeholder icons created!');
  console.log('\nTo generate real icons:');
  console.log('  1. Install canvas: npm install canvas');
  console.log('  2. Run: node scripts/generate-icons.js');
  console.log('  Or use an online PWA icon generator');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePlaceholderIcons().catch(console.error);
}

export { generatePlaceholderIcons, SIZES };
