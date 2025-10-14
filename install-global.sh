#!/bin/bash
# Global installation script for Laminar
# Works around npm bug where global installs from GitHub create broken symlinks

set -e

echo "🔧 Laminar Global Installer"
echo "============================"
echo ""
echo "This script works around an npm bug with global GitHub installs."
echo "It will install Laminar globally using a tarball."
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Create temp directory
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo "📦 Downloading Laminar from GitHub..."
cd "$TMP_DIR"
curl -sL https://github.com/anteew/Laminar/archive/refs/heads/main.tar.gz | tar xz

echo "📦 Building package..."
cd Laminar-main
npm pack --silent

echo "🌍 Installing globally..."
TARBALL=$(ls agent_vega-laminar-*.tgz)
npm install -g "$TARBALL"

echo ""
echo "✅ Installation complete!"
echo ""

# Show post-install instructions
# Try to run from installed location first, fall back to local script
if command -v laminar-mcp &> /dev/null; then
    # Find the installation directory
    INSTALL_DIR=$(npm root -g)/laminar
    if [ -f "$INSTALL_DIR/dist/scripts/post-install-msg.js" ]; then
        node "$INSTALL_DIR/dist/scripts/post-install-msg.js"
    else
        # Fallback: download and display from GitHub
        curl -sL https://raw.githubusercontent.com/anteew/Laminar/main/scripts/post-install-msg.js | node
    fi
else
    echo "⚠️  Installation may not be complete. Try running:"
    echo "  lam --help"
    echo "  laminar-mcp --help"
fi
