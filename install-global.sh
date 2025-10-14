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
echo "Test your installation:"
echo "  lam --help"
echo "  laminar-mcp --help"
echo ""
echo "To uninstall:"
echo "  npm uninstall -g @agent_vega/laminar"
