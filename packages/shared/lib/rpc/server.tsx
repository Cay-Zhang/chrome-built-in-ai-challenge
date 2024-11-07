import * as handlers from '.';
import type { Message } from '.';

export function serve() {
  chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
    console.log(sender.tab ? 'from a content script: ' + sender.tab.url : 'from the extension');
    try {
      const result = (handlers as any)[request.rpcId](...request.args);
      if (result instanceof Promise) {
        result
          .then((resolvedResult: any) => {
            console.log('rpcId:', request.rpcId, 'args:', request.args, 'result:', resolvedResult);
            sendResponse(resolvedResult);
          })
          .catch((error: Error) => {
            console.error('Error handling RPC:', error);
            sendResponse(undefined);
          });
      } else {
        console.log('rpcId:', request.rpcId, 'args:', request.args, 'result:', result);
        sendResponse(result);
      }
    } catch (error) {
      console.error('Error handling RPC:', error);
      sendResponse(undefined);
    }
    return true;
  });
}
