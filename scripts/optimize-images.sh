#!/bin/bash
# Image Optimization Script for LocalRnk
# Converts images to WebP and creates responsive sizes

echo "🖼️  Starting Image Optimization"
echo "==============================="

# Directories to process
IMAGE_DIRS=("public" "src/assets" "dist/assets")
SUPPORTED_EXTENSIONS="jpg jpeg png gif"

# Quality settings
WEBP_QUALITY=85
AVIF_QUALITY=80

# Max width for responsive images
MAX_WIDTH=1920

for dir in "${IMAGE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo ""
    echo "📁 Processing: $dir"
    
    find "$dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \) | while read -r img; do
      filename=$(basename "$img")
      dirname=$(dirname "$img")
      name="${filename%.*}"
      
      # Skip if WebP already exists
      if [ -f "$dirname/$name.webp" ]; then
        echo "  ⏭️  Skipping $filename (WebP exists)"
        continue
      fi
      
      echo "  🔄 Converting: $filename"
      
      # Convert to WebP
      if command -v cwebp &> /dev/null; then
        cwebp -q $WEBP_QUALITY "$img" -o "$dirname/$name.webp" 2>/dev/null && \
          echo "    ✅ WebP created"
      else
        echo "    ⚠️  cwebp not installed, skipping WebP"
      fi
      
      # Create responsive sizes for large images
      width=$(identify -format "%w" "$img" 2>/dev/null || echo "0")
      if [ "$width" -gt "$MAX_WIDTH" ] 2>/dev/null; then
        echo "    📐 Creating responsive sizes..."
        
        for size in 640 768 1024 1280 1920; do
          if [ "$width" -gt "$size" ]; then
            convert "$img" -resize "${size}x" -quality $WEBP_QUALITY "$dirname/${name}-${size}w.webp" 2>/dev/null
          fi
        done
      fi
    done
  fi
done

echo ""
echo "✅ Image optimization complete!"
echo "💡 Tip: Use the Picture component to serve WebP with fallbacks"
