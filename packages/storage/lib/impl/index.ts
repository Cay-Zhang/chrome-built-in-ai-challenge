import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';

export * from './exampleThemeStorage';

export const openRouterApiKeyStorage = createStorage<string | null>('open-router-api-key', null, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
