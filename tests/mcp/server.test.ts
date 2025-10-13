import { describe, test, expect } from 'vitest';
import { createLaminarServer } from '../../src/mcp/server.js';

describe('Laminar MCP Server Integration Tests', () => {
  const server = createLaminarServer();

  describe('Tool Discovery', () => {
    test('listTools returns all expected tools', () => {
      const tools = server.listTools();
      const toolNames = tools.map(t => t.name);
      
      expect(toolNames).toContain('readme.get');
      expect(toolNames).toContain('workspace.roots.list');
      expect(toolNames).toContain('workspace.root.register');
      expect(toolNames).toContain('workspace.root.remove');
      expect(toolNames).toContain('workspace.root.show');
      expect(toolNames).toContain('run');
      expect(toolNames).toContain('summary');
      expect(toolNames).toContain('show');
      expect(toolNames).toContain('digest.generate');
      expect(toolNames).toContain('diff.get');
      expect(toolNames).toContain('trends.query');
      expect(toolNames).toContain('rules.get');
      expect(toolNames).toContain('rules.set');
    });

    test('each tool has name and description', () => {
      const tools = server.listTools();
      tools.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
      });
    });
  });

  describe('Tool Execution', () => {
    test('readme.get returns overview', async () => {
      const result = await server.call('readme.get', {}) as any;
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('commands');
      expect(result.title).toBe('Laminar MCP');
    });

    test('workspace.roots.list returns projects array', async () => {
      const result = await server.call('workspace.roots.list', {}) as any;
      expect(result).toHaveProperty('projects');
      expect(Array.isArray(result.projects)).toBe(true);
    });

    test('rules.get handles missing config gracefully', async () => {
      const result = await server.call('rules.get', {}) as any;
      expect(result).toHaveProperty('config');
    });
  });

  describe('Error Handling', () => {
    test('calling non-existent tool throws error', async () => {
      await expect(server.call('nonexistent.tool', {})).rejects.toThrow('Unknown tool');
    });

    test('workspace.root.show without id throws error', async () => {
      await expect(server.call('workspace.root.show', {})).rejects.toThrow('id is required');
    });

    test('workspace.root.register without root throws error', async () => {
      await expect(server.call('workspace.root.register', {})).rejects.toThrow('root is required');
    });
  });
});
