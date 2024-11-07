import { JsonValue } from 'type-fest';

export type Message = {
  rpcId: string;
  args: JsonValue[];
};

export async function getCurrentTabTitle(): Promise<string | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs.at(0)?.title ?? null;
}
