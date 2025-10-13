#!/bin/bash

set -e  # Exit on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Laminar Installation E2E Test ===${NC}"

cleanup() {
    echo -e "${YELLOW}Cleaning up test directory...${NC}"
    rm -rf /tmp/laminar-e2e-test
}
trap cleanup EXIT

TEST_DIR="/tmp/laminar-e2e-test"
rm -rf $TEST_DIR
mkdir -p $TEST_DIR
cd $TEST_DIR

echo -e "${YELLOW}Step 1: Initialize test project${NC}"
npm init -y > /dev/null 2>&1

echo -e "${YELLOW}Step 2: Install Laminar from source${NC}"
LAMINAR_SOURCE=${LAMINAR_SOURCE:-$(git rev-parse --show-toplevel 2>/dev/null || echo ".")}
npm install -D "$LAMINAR_SOURCE"

echo -e "${YELLOW}Step 3: Verify package.json exists in installation${NC}"
if [ ! -f node_modules/@agent_vega/laminar/package.json ]; then
    echo -e "${RED}✗ FAILED: package.json missing from installed package${NC}"
    exit 1
fi
echo -e "${GREEN}✓ package.json found${NC}"

echo -e "${YELLOW}Step 4: Verify dist files exist${NC}"
if [ ! -f node_modules/@agent_vega/laminar/dist/scripts/lam.js ]; then
    echo -e "${RED}✗ FAILED: dist/scripts/lam.js missing${NC}"
    exit 1
fi
if [ ! -f node_modules/@agent_vega/laminar/dist/scripts/mcp-server.js ]; then
    echo -e "${RED}✗ FAILED: dist/scripts/mcp-server.js missing${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All dist files found${NC}"

echo -e "${YELLOW}Step 5: Test lam --help${NC}"
if ! npx lam --help > /dev/null 2>&1; then
    echo -e "${RED}✗ FAILED: lam --help command failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ lam --help works${NC}"

echo -e "${YELLOW}Step 6: Test lam init${NC}"
if ! npx lam init --template minimal > /dev/null 2>&1; then
    echo -e "${RED}✗ FAILED: lam init command failed${NC}"
    exit 1
fi
if [ ! -f laminar.config.json ]; then
    echo -e "${RED}✗ FAILED: lam init did not create config file${NC}"
    exit 1
fi
echo -e "${GREEN}✓ lam init works${NC}"

echo -e "${YELLOW}Step 7: Test lam project list${NC}"
if ! npx lam project list > /dev/null 2>&1; then
    echo -e "${RED}✗ FAILED: lam project list command failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ lam project list works${NC}"

echo -e "${YELLOW}Step 8: Verify bin symlinks${NC}"
LAM_BIN=$(readlink -f node_modules/.bin/lam)
if [ ! -f "$LAM_BIN" ]; then
    echo -e "${RED}✗ FAILED: lam symlink points to non-existent file: $LAM_BIN${NC}"
    exit 1
fi
echo -e "${GREEN}✓ lam symlink valid: $LAM_BIN${NC}"

MCP_BIN=$(readlink -f node_modules/.bin/laminar-mcp)
if [ ! -f "$MCP_BIN" ]; then
    echo -e "${RED}✗ FAILED: laminar-mcp symlink points to non-existent file: $MCP_BIN${NC}"
    exit 1
fi
echo -e "${GREEN}✓ laminar-mcp symlink valid: $MCP_BIN${NC}"

echo -e "${GREEN}=== ALL TESTS PASSED ===${NC}"
echo -e "${GREEN}Installation works correctly!${NC}"
