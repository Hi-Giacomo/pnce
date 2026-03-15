// module dependenciesType definition

export interface modulesConfig {
  // module dependencies
  externalModules?: Record<string, string>; // { "module-name": "^1.0.0" }

  // module
  options?: {
    // Directory
    installDir?: string;
    // Yes/No git module directory
    gitIgnore?: boolean;
    // Yes/Nofile
    lockfile?: boolean;
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
      dependencies?: Record<string, string>; // module dependencies
    }
  >;

  // fileversion
  lockfileversion: number;

  //
  generatedAt: string;
}

export const DEFAULT_MODULES_CONFIG: modulesConfig = {
  externalModules: {},
  options: {
    installDir: 'src/external_modules',
    gitIgnore: true,
    lockfile: true,
  },
};
