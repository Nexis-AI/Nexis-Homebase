#!/bin/bash

# Set the destination directories
TOKENS_DIR="public/tokens"
PROTOCOLS_DIR="public/protocols"

# Create directories if they don't exist
mkdir -p "$TOKENS_DIR"
mkdir -p "$PROTOCOLS_DIR"

# Download common token icons
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg" > "$TOKENS_DIR/ethereum.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg" > "$TOKENS_DIR/usdc.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg" > "$TOKENS_DIR/polygon.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg" > "$TOKENS_DIR/usdt.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg" > "$TOKENS_DIR/bnb.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/uni.svg" > "$TOKENS_DIR/uniswap.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/dai.svg" > "$TOKENS_DIR/dai.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/btc.svg" > "$TOKENS_DIR/bitcoin.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/wbtc.svg" > "$TOKENS_DIR/wbtc.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/sol.svg" > "$TOKENS_DIR/solana.svg"
curl -s "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/avax.svg" > "$TOKENS_DIR/avalanche.svg"

# Create a basic Nexis icon
cat > "$TOKENS_DIR/nexis.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="16" fill="#0C50FF"/>
  <path d="M22.5,9.5l-7,3.5l-7,-3.5l7,-3.5l7,3.5zM8.5,11l7,3.5v7l-7,-3.5v-7zM23.5,11v7l-7,3.5v-7l7,-3.5z" fill="white"/>
</svg>
EOF

# Create a combined ETH-USDC icon
cat > "$TOKENS_DIR/eth-usdc.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="11" cy="16" r="10" fill="#627EEA"/>
  <path d="M11,6v7.36l6.2,-3.68l-6.2,-3.68z" fill="white" fill-opacity="0.8"/>
  <path d="M11,6l-6.2,3.68l6.2,3.68v-7.36z" fill="white"/>
  <path d="M11,26v-7.36l-6.2,-3.68l6.2,11.04z" fill="white"/>
  <path d="M11,18.64v7.36l6.2,-11.04l-6.2,3.68z" fill="white" fill-opacity="0.8"/>
  <circle cx="21" cy="16" r="10" fill="#2775CA"/>
  <path d="M21,12.95c-0.42,0,-0.83,0.04,-1.23,0.11v6.45h2.46v-6.45c-0.4,-0.07,-0.81,-0.11,-1.23,-0.11zM23.78,14.41v3.68h1.23v-3.68h-1.23zM16.99,14.41v3.68h1.23v-2.46h1.23v-1.23h-2.46z" fill="white"/>
</svg>
EOF

# Download protocol icons
curl -s "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png" > "$PROTOCOLS_DIR/aave.png"
curl -s "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png" > "$PROTOCOLS_DIR/uniswap.png"

# Convert PNG to SVG (simplified, not actual conversion)
for file in "$PROTOCOLS_DIR"/*.png; do
    base=$(basename "$file" .png)
    # Create a basic SVG wrapper (this is just a placeholder, not an actual conversion)
    cat > "$PROTOCOLS_DIR/$base.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <image href="$(basename "$file")" width="32" height="32"/>
</svg>
EOF
done

echo "Token and protocol icons downloaded successfully!" 