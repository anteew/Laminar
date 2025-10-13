export declare function createTempDir(): string;
export declare function cleanupTempDir(dir: string): void;
export declare function execCLI(args: string[], cwd?: string): {
    stdout: string;
    stderr: string;
    code: number;
};
export declare function setupMinimalProject(dir: string): void;
//# sourceMappingURL=test-utils.d.ts.map