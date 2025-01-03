import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, isAcronymDetectionEnabledStorage, openRouterApiKeyStorage } from '@extension/storage';
import { Checkbox, Input } from '@extension/ui';
import type { ComponentPropsWithoutRef } from 'react';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const openRouterApiKey = useStorage(openRouterApiKeyStorage);
  const isAcronymDetectionEnabled = useStorage(isAcronymDetectionEnabledStorage);
  const isLight = theme === 'light';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  const injectContentScript = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
    }

    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch(err => {
        // Handling errors related to other paths
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        }
      });
  };

  return (
    <div
      className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'} ${theme === 'dark' ? 'dark text-foreground' : 'text-foreground'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <h1 className="text-2xl font-bold">Contextual Lookup</h1>
        <ToggleButton>Toggle theme</ToggleButton>
      </header>
      <div className="mt-4 flex flex-col gap-2">
        <label htmlFor="api-key" className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
          OpenRouter API Key
        </label>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter API key"
          value={openRouterApiKey ?? ''}
          onChange={e => openRouterApiKeyStorage.set(e.target.value || null)}
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="acronym-detection"
            checked={isAcronymDetectionEnabled}
            onCheckedChange={async value => {
              if (value !== 'indeterminate') {
                await isAcronymDetectionEnabledStorage.set(value);
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab.id) await chrome.tabs.reload(tab.id);
              }
            }}
          />
          <label
            htmlFor="acronym-detection"
            className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
            Enable acronym detection
          </label>
        </div>
      </div>
    </div>
  );
};

const ToggleButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const theme = useStorage(exampleThemeStorage);
  return (
    <button
      className={
        props.className +
        ' ' +
        'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
        (theme === 'light' ? 'bg-white text-black shadow-black' : 'bg-black text-white')
      }
      onClick={exampleThemeStorage.toggle}>
      {props.children}
    </button>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
