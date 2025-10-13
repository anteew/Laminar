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
    root: string;
    configPath?: string;
    reportsDir: string;
    historyPath: string;
    lane?: string;
    warnings: string[];
}
export declare function resolveContext(params: ResolveParams): ResolvedContext;
export declare function resolveReportsAbsolute(root: string, reportsDir: string): string;
//# sourceMappingURL=resolve.d.ts.map