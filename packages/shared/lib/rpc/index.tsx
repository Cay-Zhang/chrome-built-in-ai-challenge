import { JsonValue } from 'type-fest';

export type Message = {
  rpcId: string;
  args: JsonValue[];
};

export async function getCurrentTabTitle(): Promise<string | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs.at(0)?.title ?? null;
}

export async function createTab(createProperties: chrome.tabs.CreateProperties) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabs.create({
    index: activeTab ? activeTab.index + 1 : undefined,
    ...createProperties,
  });
}
