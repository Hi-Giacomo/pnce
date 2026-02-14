import { ApiService } from './api.service';
export declare class ModuleService {
    private api;
    constructor(api: ApiService);
    upload(moduleDir: string): Promise<void>;
    install(moduleName: string, version?: string, installDir?: string): Promise<void>;
    list(): Promise<void>;
    search(query: string): Promise<void>;
    info(moduleName: string): Promise<void>;
    getStats(): Promise<void>;
    private createPackage;
    private extractTgz;
    private formatSize;
    /**
     * 确保 .npmignore 文件存在，排除不需要打包的目录
     * @param moduleDir 模块目录
     */
    private ensureNpmignore;
    /**
     * 解析并安装模块依赖
     * @param moduleName 模块名称
     * @param modulePath 模块路径
     * @param projectRoot 项目根目录
     */
    private installDependencies;
    /**
     * 安装 npm 依赖
     * @param dependencies npm 依赖列表
     * @param projectRoot 项目根目录
     */
    private installNpmDependencies;
}
//# sourceMappingURL=module.service.d.ts.map