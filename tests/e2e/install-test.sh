#!/bin/bash

set -e  # Exit on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test mode selection
TEST_MODE=${TEST_MODE:-"local"}  # local, script, or all

echo -e "${YELLOW}=== Laminar Installation E2E Test ===${NC}"
echo -e "${BLUE}Test mode: $TEST_MODE${NC}"
echo ""

cleanup() {
    echo -e "${YELLOW}Cleaning up test directories...${NC}"
    rm -rf /tmp/laminar-e2e-test-*
}
trap cleanup EXIT

LAMINAR_SOURCE=${LAMINAR_SOURCE:-$(git rev-parse --show-toplevel 2>/dev/null || echo ".")}

# ==============================================================================
# Test 1: Local Install (npm install -D)
# ==============================================================================
test_local_install() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}TEST 1: Local Install (npm install -D)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    TEST_DIR="/tmp/laminar-e2e-test-local"
    rm -rf $TEST_DIR
    mkdir -p $TEST_DIR
    cd $TEST_DIR

    echo -e "${YELLOW}Step 1.1: Initialize test project${NC}"
    npm init -y > /dev/null 2>&1

    echo -e "${YELLOW}Step 1.2: Install Laminar locally from source${NC}"
    npm install -D "$LAMINAR_SOURCE"

    echo -e "${YELLOW}Step 1.3: Verify package.json exists${NC}"
    if [ ! -f node_modules/@agent_vega/laminar/package.json ]; then
        echo -e "${RED}✗ FAILED: package.json missing${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ package.json found${NC}"

    echo -e "${YELLOW}Step 1.4: Verify dist files exist${NC}"
    if [ ! -f node_modules/@agent_vega/laminar/dist/scripts/lam.js ]; then
        echo -e "${RED}✗ FAILED: dist/scripts/lam.js missing${NC}"
        return 1
    fi
    if [ ! -f node_modules/@agent_vega/laminar/dist/scripts/mcp-server.js ]; then
        echo -e "${RED}✗ FAILED: dist/scripts/mcp-server.js missing${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ All dist files found${NC}"

    echo -e "${YELLOW}Step 1.5: Test lam --help${NC}"
    if ! npx lam --help > /dev/null 2>&1; then
        echo -e "${RED}✗ FAILED: lam --help failed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ lam --help works${NC}"

    echo -e "${YELLOW}Step 1.6: Test lam init${NC}"
    if ! npx lam init --template minimal > /dev/null 2>&1; then
        echo -e "${RED}✗ FAILED: lam init failed${NC}"
        return 1
    fi
    if [ ! -f laminar.config.json ]; then
        echo -e "${RED}✗ FAILED: lam init did not create config${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ lam init works${NC}"

    echo -e "${YELLOW}Step 1.7: Test lam project list${NC}"
    if ! npx lam project list > /dev/null 2>&1; then
        echo -e "${RED}✗ FAILED: lam project list failed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ lam project list works${NC}"

    echo -e "${YELLOW}Step 1.8: Verify bin symlinks${NC}"
    LAM_BIN=$(readlink -f node_modules/.bin/lam)
    if [ ! -f "$LAM_BIN" ]; then
        echo -e "${RED}✗ FAILED: lam symlink broken: $LAM_BIN${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ lam symlink valid${NC}"

    MCP_BIN=$(readlink -f node_modules/.bin/laminar-mcp)
    if [ ! -f "$MCP_BIN" ]; then
        echo -e "${RED}✗ FAILED: laminar-mcp symlink broken: $MCP_BIN${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ laminar-mcp symlink valid${NC}"

    echo -e "${GREEN}✓ Local install test PASSED${NC}"
    echo ""
}

# ==============================================================================
# Test 2: install-global.sh Script
# ==============================================================================
test_script_install() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}TEST 2: install-global.sh Script${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    TEST_DIR="/tmp/laminar-e2e-test-script"
    rm -rf $TEST_DIR
    mkdir -p $TEST_DIR
    cd $TEST_DIR

    echo -e "${YELLOW}Step 2.1: Initialize a dummy project (required for lam)${NC}"
    npm init -y > /dev/null 2>&1
    echo -e "${GREEN}✓ Project initialized${NC}"

    echo -e "${YELLOW}Step 2.2: Run install-global.sh script${NC}"
    if ! bash "$LAMINAR_SOURCE/install-global.sh" > /dev/null 2>&1; then
        echo -e "${RED}✗ FAILED: install-global.sh script failed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Script executed successfully${NC}"

    echo -e "${YELLOW}Step 2.3: Verify lam command is available${NC}"
    if ! command -v lam &> /dev/null; then
        echo -e "${RED}✗ FAILED: lam command not in PATH${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ lam command found in PATH${NC}"

    echo -e "${YELLOW}Step 2.4: Verify laminar-mcp command is available${NC}"
    if ! command -v laminar-mcp &> /dev/null; then
        echo -e "${RED}✗ FAILED: laminar-mcp command not in PATH${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ laminar-mcp command found in PATH${NC}"

    echo -e "${YELLOW}Step 2.5: Test lam --help${NC}"
    LAM_PATH=$(which lam)
    LAM_OUTPUT=$("$LAM_PATH" --help 2>&1)
    if [ $? -ne 0 ] || [ -z "$LAM_OUTPUT" ]; then
        echo -e "${RED}✗ FAILED: lam --help failed${NC}"
        echo "Output: $LAM_OUTPUT"
        return 1
    fi
    echo -e "${GREEN}✓ lam --help works${NC}"

    echo -e "${YELLOW}Step 2.6: Test laminar-mcp --help${NC}"
    MCP_PATH=$(which laminar-mcp)
    MCP_OUTPUT=$("$MCP_PATH" --help 2>&1)
    if [ $? -ne 0 ] || [ -z "$MCP_OUTPUT" ]; then
        echo -e "${RED}✗ FAILED: laminar-mcp --help failed${NC}"
        echo "Output: $MCP_OUTPUT"
        return 1
    fi
    echo -e "${GREEN}✓ laminar-mcp --help works${NC}"

    echo -e "${YELLOW}Step 2.7: Cleanup global install${NC}"
    npm uninstall -g @agent_vega/laminar > /dev/null 2>&1
    echo -e "${GREEN}✓ Global install cleaned up${NC}"

    echo -e "${GREEN}✓ Script install test PASSED${NC}"
    echo ""
}

# ==============================================================================
# Test 3: npm install -g (KNOWN BROKEN - SKIPPED)
# ==============================================================================
test_global_install() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}TEST 3: npm install -g (KNOWN BROKEN)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo -e "${RED}⚠ SKIPPED: npm install -g github:anteew/Laminar is broken${NC}"
    echo -e "${RED}⚠ This is a known npm bug with global GitHub installs${NC}"
    echo -e "${RED}⚠ npm creates symlinks to incomplete cache directories${NC}"
    echo -e "${RED}⚠ Use install-global.sh script instead (tested above)${NC}"
    echo ""
}

# ==============================================================================
# Run Tests
# ==============================================================================

FAILED_TESTS=0

if [ "$TEST_MODE" = "local" ] || [ "$TEST_MODE" = "all" ]; then
    if ! test_local_install; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

if [ "$TEST_MODE" = "script" ] || [ "$TEST_MODE" = "all" ]; then
    if ! test_script_install; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

if [ "$TEST_MODE" = "global" ] || [ "$TEST_MODE" = "all" ]; then
    test_global_install
fi

# ==============================================================================
# Summary
# ==============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo -e "${GREEN}Installation works correctly!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED_TESTS TEST(S) FAILED${NC}"
    exit 1
fi
