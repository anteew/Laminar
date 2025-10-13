export interface ProjectRecord {
    id: string;
    root: string;
    configPath?: string;
    reportsDir?: string;
    historyPath?: string;
    repoUrl?: string;
    tags?: string[];
    createdAt?: string;
}
export interface Registry {
    projects: ProjectRecord[];
}
export declare function getHomeConfigDir(): string;
export declare function getRegistryPath(): string;
export declare function loadRegistry(): Registry;
export declare function saveRegistry(reg: Registry): void;
export declare function listProjects(): ProjectRecord[];
export declare function getProject(id: string): ProjectRecord | undefined;
export declare function deriveIdFromRoot(root: string): string;
export declare function registerProject(input: ProjectRecord): ProjectRecord;
export declare function removeProject(id: string): boolean;
//# sourceMappingURL=registry.d.ts.map