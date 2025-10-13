import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
export function getHomeConfigDir() {
    const xdg = process.env.XDG_CONFIG_HOME;
    const base = xdg && xdg.trim() ? xdg : path.join(os.homedir(), '.laminar');
    return xdg ? path.join(xdg, 'laminar') : base; // if XDG set, ensure /laminar suffix
}
export function getRegistryPath() {
    const dir = getHomeConfigDir();
    return path.join(dir, 'registry.json');
}
export function loadRegistry() {
    const p = getRegistryPath();
    try {
        if (!fs.existsSync(p))
            return { projects: [] };
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (Array.isArray(data))
            return { projects: data };
        if (data && Array.isArray(data.projects))
            return { projects: data.projects };
        return { projects: [] };
    }
    catch {
        return { projects: [] };
    }
}
export function saveRegistry(reg) {
    const dir = path.dirname(getRegistryPath());
    fs.mkdirSync(dir, { recursive: true });
    const data = JSON.stringify(reg, null, 2);
    fs.writeFileSync(getRegistryPath(), data);
}
export function listProjects() {
    return loadRegistry().projects;
}
export function getProject(id) {
    return loadRegistry().projects.find(p => p.id === id);
}
export function deriveIdFromRoot(root) {
    const base = path.basename(path.resolve(root));
    return base.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
}
export function registerProject(input) {
    const reg = loadRegistry();
    const now = new Date().toISOString();
    const existingIndex = reg.projects.findIndex(p => p.id === input.id);
    const record = {
        ...input,
        createdAt: reg.projects[existingIndex]?.createdAt || now,
    };
    if (existingIndex >= 0) {
        reg.projects[existingIndex] = record;
    }
    else {
        reg.projects.push(record);
    }
    saveRegistry(reg);
    return record;
}
export function removeProject(id) {
    const reg = loadRegistry();
    const n = reg.projects.length;
    const left = reg.projects.filter(p => p.id !== id);
    if (left.length === n)
        return false;
    reg.projects = left;
    saveRegistry(reg);
    return true;
}
//# sourceMappingURL=registry.js.map