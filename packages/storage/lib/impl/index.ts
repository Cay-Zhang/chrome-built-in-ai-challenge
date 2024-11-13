import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { ChatModel } from 'openai/resources';

export * from './exampleThemeStorage';

export const openRouterApiKeyStorage = createStorage<string | null>('open-router-api-key', null, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export type Model = (string & {}) | '_builtin' | ChatModel;

export const modelStorage = createStorage<Model>('model', 'chatgpt-4o-latest', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
