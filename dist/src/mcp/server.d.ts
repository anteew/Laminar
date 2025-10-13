export interface ToolDef<I = any, O = any> {
    name: string;
    description: string;
    handler: (input: I) => Promise<O>;
}
export declare class LaminarMcpServer {
    private tools;
    addTool<I, O>(def: ToolDef<I, O>): void;
    listTools(): {
        name: string;
        description: string;
    }[];
    call<I, O>(name: string, input: I): Promise<O>;
}
export declare function createLaminarServer(): LaminarMcpServer;
//# sourceMappingURL=server.d.ts.map