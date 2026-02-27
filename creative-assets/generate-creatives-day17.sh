#!/bin/bash
# HuggingFace FLUX.1 Creative Batch Generator
# Day 17 - 30 Creatives
# Usage: bash generate-creatives-day17.sh

set -e

API_URL="https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev"
API_TOKEN="${HUGGINGFACE_TOKEN}"
OUTPUT_DIR="/root/clawd/local-rnk-booster/creative-assets/generated/day17"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Array of creatives: ID|Category|Filename|Prompt
CREATIVES=(
  "PP-01|Pain Point|pain-money-loss|A dramatic image of money flying away from a frustrated small business owner, dark cyberpunk aesthetic with neon green accents, deep space background, representing lost revenue to lead aggregators, cinematic lighting, 4K"
  "PP-02|Pain Point|pain-invisibility|A local business owner standing alone in darkness while competitors glow with neon blue visibility, cyberpunk cityscape, deep space background, feeling of being invisible online, dramatic shadows"
  "PP-03|Pain Point|pain-overwhelm|A business owner drowning in digital notifications and paperwork, dark tech noir aesthetic, neon red alert glows, deep space background, feeling overwhelmed by marketing complexity"
  "SP-01|Social Proof|proof-success|A happy contractor celebrating in front of glowing 5-star reviews, neon green success indicators, dark cyberpunk aesthetic, deep space background, triumphant pose, cinematic lighting"
  "SP-02|Social Proof|proof-reviews|A wall of glowing 5-star reviews floating in deep space, neon green stars, dark tech noir aesthetic, representing reputation success, dramatic composition, 4K"
  "UR-01|Urgency|urgency-timer|A countdown timer with glowing neon red numbers showing limited availability, dark cyberpunk aesthetic, deep space background, urgency indicators, dramatic lighting, 4K"
  "UR-02|Urgency|urgency-hourglass|An hourglass with neon green sand running out, representing opportunity cost, dark cyberpunk aesthetic, deep space background, dramatic composition, cinematic"
  "FX-01|Foxy|foxy-hero|An anthropomorphic fox in a business suit standing heroically, glowing neon green outline, cyberpunk tech noir aesthetic, deep space background, LocalRank mascot, confident pose, cinematic lighting"
  "FX-02|Foxy|foxy-working|A fox mascot typing on a holographic keyboard with glowing code, neon blue screen glow, cyberpunk aesthetic, deep space background, working hard for clients"
  "ED-01|Educational|edu-gmb|A holographic Google Business Profile interface floating in deep space with glowing neon green highlights on key features, cyberpunk aesthetic, educational diagram style"
  "ED-02|Educational|edu-ranking|A 3D pyramid showing GMB ranking factors with glowing neon accents, each level illuminated, cyberpunk aesthetic, deep space background, educational infographic style"
)

echo "🎨 Starting HuggingFace FLUX.1 Creative Batch"
echo "=============================================="
echo "Timestamp: $TIMESTAMP"
echo "Output: $OUTPUT_DIR"
echo "Total Creatives: ${#CREATIVES[@]}"
echo ""

# Initialize CSV
echo "creative_id,category,filename,status,url,timestamp" > "$OUTPUT_DIR/upload-crushai-$TIMESTAMP.csv"

# Generate each creative
for creative in "${CREATIVES[@]}"; do
  IFS='|' read -r ID CATEGORY FILENAME PROMPT <<< "$creative"
  
  echo "Generating: $ID - $CATEGORY"
  
  # Call HuggingFace API
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"inputs\": \"$PROMPT\"}" \
    "$API_URL" \
    --output "$OUTPUT_DIR/$FILENAME.jpg" \
    -w "%{http_code}" 2>/dev/null || echo "000")
  
  if [ "$RESPONSE" = "200" ]; then
    echo "  ✅ Success: $FILENAME.jpg"
    echo "$ID,$CATEGORY,$FILENAME.jpg,generated,file://$OUTPUT_DIR/$FILENAME.jpg,$TIMESTAMP" >> "$OUTPUT_DIR/upload-crushai-$TIMESTAMP.csv"
  else
    echo "  ❌ Failed (HTTP $RESPONSE): $FILENAME.jpg"
    echo "$ID,$CATEGORY,$FILENAME.jpg,failed,error,$TIMESTAMP" >> "$OUTPUT_DIR/upload-crushai-$TIMESTAMP.csv"
  fi
  
  # Rate limiting - avoid overwhelming the API
  sleep 2
done

echo ""
echo "=============================================="
echo "✅ Batch Complete!"
echo "Output Directory: $OUTPUT_DIR"
echo "Upload CSV: upload-crushai-$TIMESTAMP.csv"
echo ""
ls -lh "$OUTPUT_DIR"
