import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface ProjectRecord {
  id: string;
  root: string; // absolute path
  configPath?: string; // absolute path (optional)
  reportsDir?: string; // relative to root (default: "reports")
  historyPath?: string; // absolute or relative to root (default: root/reports/history.jsonl)
  repoUrl?: string;
  tags?: string[];
  createdAt?: string; // ISO timestamp
}

export interface Registry {
  projects: ProjectRecord[];
}

export function getHomeConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.trim() ? xdg : path.join(os.homedir(), '.laminar');
  return xdg ? path.join(xdg, 'laminar') : base; // if XDG set, ensure /laminar suffix
}

export function getRegistryPath(): string {
  const dir = getHomeConfigDir();
  return path.join(dir, 'registry.json');
}

export function loadRegistry(): Registry {
  const p = getRegistryPath();
  try {
    if (!fs.existsSync(p)) return { projects: [] };
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    if (Array.isArray(data)) return { projects: data as ProjectRecord[] };
    if (data && Array.isArray(data.projects)) return { projects: data.projects as ProjectRecord[] };
    return { projects: [] };
  } catch {
    return { projects: [] };
  }
}

export function saveRegistry(reg: Registry): void {
  const dir = path.dirname(getRegistryPath());
  fs.mkdirSync(dir, { recursive: true });
  const data = JSON.stringify(reg, null, 2);
  fs.writeFileSync(getRegistryPath(), data);
}

export function listProjects(): ProjectRecord[] {
  return loadRegistry().projects;
}

export function getProject(id: string): ProjectRecord | undefined {
  return loadRegistry().projects.find(p => p.id === id);
}

export function deriveIdFromRoot(root: string): string {
  const base = path.basename(path.resolve(root));
  return base.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
}

export function registerProject(input: ProjectRecord): ProjectRecord {
  const reg = loadRegistry();
  const now = new Date().toISOString();
  const existingIndex = reg.projects.findIndex(p => p.id === input.id);
  const record: ProjectRecord = {
    ...input,
    createdAt: reg.projects[existingIndex]?.createdAt || now,
  };
  if (existingIndex >= 0) {
    reg.projects[existingIndex] = record;
  } else {
    reg.projects.push(record);
  }
  saveRegistry(reg);
  return record;
}

export function removeProject(id: string): boolean {
  const reg = loadRegistry();
  const n = reg.projects.length;
  const left = reg.projects.filter(p => p.id !== id);
  if (left.length === n) return false;
  reg.projects = left;
  saveRegistry(reg);
  return true;
}

