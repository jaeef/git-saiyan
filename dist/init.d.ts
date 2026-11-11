export interface InitOptions {
    force?: boolean;
    actionRef?: string;
    cwd?: string;
}
export interface InitResult {
    workflowPath: string;
    readmeSnippet: string;
}
export declare const DEFAULT_ACTION_REF = "jaeef/git-saiyan@v1";
export declare function buildWorkflow(actionRef?: string): string;
export declare function buildReadmeSnippet(username?: string): string;
export declare function initProfileRepo(options?: InitOptions): InitResult;
