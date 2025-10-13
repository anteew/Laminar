import * as fs from 'node:fs';
import * as path from 'node:path';
import { getProject, listProjects, ProjectRecord } from '../project/registry.js';

export interface ResolveParams {
  project?: string;
  root?: string;
  config?: string;
  reports?: string;
  history?: string;
  lane?: string;
}

export interface ResolvedContext {
  project?: string;
  root: string; // absolute
  configPath?: string; // absolute
  reportsDir: string; // may be relative to root
  historyPath: string; // absolute or relative to root
  lane?: string;
  warnings: string[];
}

function tryReadJson(p: string): any | undefined {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return undefined;
  }
}

export function resolveContext(params: ResolveParams): ResolvedContext {
  const warnings: string[] = [];

  // Inputs from env
  const envProject = process.env.LAMINAR_PROJECT || undefined;
  const envRoot = process.env.LAMINAR_ROOT || undefined;
  const envConfig = process.env.LAMINAR_CONFIG || undefined;
  const envReports = process.env.LAMINAR_REPORTS_DIR || undefined;
  const envHistory = process.env.LAMINAR_HISTORY || undefined;
  const envLane = process.env.LAMINAR_LANE || undefined;

  // Params take precedence over env
  const project = params.project ?? envProject;

  // Resolve project → record
  let record: ProjectRecord | undefined;
  if (project) record = getProject(project);

  // Root resolution
  let root = params.root ?? envRoot ?? record?.root ?? process.cwd();
  if (!path.isAbsolute(root)) root = path.resolve(root);

  // Config path resolution
  let configPath = params.config ?? envConfig ?? record?.configPath;
  if (!configPath) {
    const p1 = path.join(root, 'laminar.config.json');
    const p2 = path.join(root, '.laminar', 'config.json');
    if (fs.existsSync(p1)) configPath = p1; else if (fs.existsSync(p2)) configPath = p2;
  }

  // Read repo config
  const cfg = configPath ? tryReadJson(configPath) : undefined;
  const cfgReports = cfg?.reportsDir as (string|undefined);
  const cfgHistory = cfg?.historyFile as (string|undefined);
  const cfgLane = cfg?.lanes?.auto as (string|undefined);

  // Reports dir & history
  const reportsDir = params.reports ?? envReports ?? record?.reportsDir ?? cfgReports ?? 'reports';
  const historyPath = params.history ?? envHistory ?? record?.historyPath ?? cfgHistory ?? path.join(reportsDir, 'history.jsonl');

  // Lane
  const lane = params.lane ?? envLane ?? cfgLane ?? undefined;

  // Conflicts warning (simple heuristic)
  if (project && params.root && record?.root && path.resolve(params.root) !== path.resolve(record.root)) {
    warnings.push(`Laminar: using param.root over project '${project}' root (${record.root})`);
  }
  if (params.config && record?.configPath && path.resolve(params.config) !== path.resolve(record.configPath)) {
    warnings.push(`Laminar: using param.config over project '${project}' config (${record.configPath})`);
  }

  return {
    project,
    root,
    configPath,
    reportsDir,
    historyPath,
    lane,
    warnings,
  };
}

export function resolveReportsAbsolute(root: string, reportsDir: string): string {
  return path.isAbsolute(reportsDir) ? reportsDir : path.join(root, reportsDir);
}

