import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import { serve } from '@extension/shared/lib/rpc/server';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

serve();
console.log('RPC server started');
