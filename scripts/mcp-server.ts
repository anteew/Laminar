#!/usr/bin/env node

/**
 * MCP Server for Laminar
 * 
 * This script provides a stdio-based MCP server that exposes Laminar's
 * test observability tools to AI agents like Claude Desktop.
 * 
 * Usage:
 *   node dist/scripts/mcp-server.js
 * 
 * For Claude Desktop, add to ~/Library/Application Support/Claude/claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "laminar": {
 *       "command": "node",
 *       "args": ["/path/to/Laminar/dist/scripts/mcp-server.js"]
 *     }
 *   }
 * }
 */

import { createLaminarServer } from '../src/mcp/server.js';

interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

class MCPStdioServer {
  private server = createLaminarServer();
  private initialized = false;

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        
        case 'tools/list':
          return this.handleToolsList(request);
        
        case 'tools/call':
          return this.handleToolsCall(request);
        
        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            }
          };
      }
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error',
          data: error.stack
        }
      };
    }
  }

  private handleInitialize(request: MCPRequest): MCPResponse {
    this.initialized = true;
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'laminar',
          version: '0.1.8'
        }
      }
    };
  }

  private handleToolsList(request: MCPRequest): MCPResponse {
    const tools = this.server.listTools();
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true
          }
        }))
      }
    };
  }

  private async handleToolsCall(request: MCPRequest): Promise<MCPResponse> {
    if (!this.initialized) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32002,
          message: 'Server not initialized'
        }
      };
    }

    const { name, arguments: args } = request.params;
    
    if (!name) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: 'Missing tool name'
        }
      };
    }

    try {
      const result = await this.server.call(name, args || {});
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32000,
          message: error.message || 'Tool execution failed',
          data: error.stack
        }
      };
    }
  }

  async start(): Promise<void> {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line: string) => {
      try {
        const request = JSON.parse(line) as MCPRequest;
        const response = await this.handleRequest(request);
        
        if (request.id !== undefined) {
          console.log(JSON.stringify(response));
        }
      } catch (error: any) {
        const errorResponse: MCPResponse = {
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: error.message
          }
        };
        console.log(JSON.stringify(errorResponse));
      }
    });

    process.stderr.write('Laminar MCP server started\n');
  }
}

const server = new MCPStdioServer();
server.start().catch((error) => {
  process.stderr.write(`Fatal error: ${error.message}\n`);
  process.exit(1);
});
