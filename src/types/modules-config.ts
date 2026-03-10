// moduleDependenciesType definition

export interface modulesConfig {
  // moduleDependencies
  externalmodules?: Record<string, string>; // { "module-name": "^1.0.0" }

  // module
  options?: {
    // Directory
    installDir?: string;
    // YesNo git module directory
    gitIgnore?: boolean;
    // YesNoFile
    lockFile?: boolean;
  };
}

export interface modulesLock {
  // module version
  modules: Record<
    string,
    {
      version: string;
      resolved: string; //  URL
      integrity?: string; // 
      dependencies?: Record<string, string>; // moduleDependencies
    }
  >;

  // FileVersion
  lockfileVersion: number;

  // 
  generatedAt: string;
}

export const DEFAULT_MODULES_CONFIG: modulesConfig = {
  externalmodules: {},
  options: {
    installDir: 'src/external_modules',
    gitIgnore: true,
    lockFile: true,
  },
};
