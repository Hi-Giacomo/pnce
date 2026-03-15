# ConfigurefileInstructions

## Overview

DirectoryPackageProjectDefaultConfigureConstant，MediumManageProjectMediumDefaultConfigureValue。

## fileInstructions

### default.config.ts

YesConfigurefile，PackageConfigureItem：

#### RegisterMediumConfigure
- `DEFAULT_REGISTRY_URL`: DefaultmoduleserviceDownloadURL（http://localhost:3000）
- `DEFAULT_WEBSITE_URL`: DefaultURL（http://localhost:5173）

#### OAuth2 AuthConfigure
- `OAUTH2_CONFIG.CLIENT_ID`: OAuth2 ClientID（module-registry-cli）
- `OAUTH2_CONFIG.REDIRECT_PORT`: OAuth2 CallbackPort（8765）
- `OAUTH2_CONFIG.AUTH_TIMEOUT`: AuthTimeout，（120000，2）
- `OAUTH2_CONFIG.SCOPE`: OAuth2 AuthorizationScope（read write）

#### VariableName
- `ENV_KEYS.MODULE_REGISTRY`: moduleserviceURLVariable（MODULE_REGISTRY）
- `ENV_KEYS.MODULE_REGISTRY_WEBSITE`: URLVariable（MODULE_REGISTRY_WEBSITE）
- `ENV_KEYS.MODULE_AUTH_TOKEN`: AuthTokenVariable（MODULE_AUTH_TOKEN）

#### Configurefile
- `CONFIG_FILE_NAME`: ConfigurefileName（.modulerc）

## Use

### CodeMediumConfigure

```typescript
import {
  DEFAULT_REGISTRY_URL,
  DEFAULT_WEBSITE_URL,
  OAUTH2_CONFIG,
  ENV_KEYS,
  CONFIG_FILE_NAME
} from '../config/default.config';
```

### Variable

SettingVariableDefaultConfigure：

```bash
export MODULE_REGISTRY=https://api.example.com
export MODULE_REGISTRY_WEBSITE=https://www.example.com
export MODULE_AUTH_TOKEN=your_token_here
```

### Configurefile

ProjectRootDirectoryCreate `.modulerc` fileConfigure：

```json
{
  "registry": "https://api.example.com",
  "website": "https://www.example.com",
  "authToken": "your_token_here"
}
```

## Configure

### DefaultValue

 `default.config.ts` fileMediumPairConstantValue。

### ConfigureItem

1.  `default.config.ts` MediumConstant
2. UpdateUseConfigureCodefile，ImportUseConstant

## Priority

ConfigurePriorityHighLow：

1. userSettingConfigurefile（`.modulerc`）
2. Variable
3. DefaultConfigureConstant（`default.config.ts`）

## Item

- DefaultConfigureConstantCompile TypeScript
- Info（AuthToken）suggestionUseVariableConfigurefile，Encoding
- OAuth2 ConfigureYes，suggestion
