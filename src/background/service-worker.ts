import { DEFAULT_SETTINGS, KEYS } from '../utils/storage';
import { MSG_EXTRACTED, MSG_OPEN_TARGET } from '../utils/types';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install' && details.reason !== 'update') return;
  void chrome.storage.local.get(KEYS.settings).then((bag) => {
    if (!bag[KEYS.settings]) {
      void chrome.storage.local.set({ [KEYS.settings]: DEFAULT_SETTINGS });
    }
  });
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (typeof message !== 'object' || message === null) return false;

  const type = (message as { type?: unknown }).type;

  // Content-script extraction results are consumed by the popup; keep the channel healthy.
  if (type === MSG_EXTRACTED) return false;

  if (type === MSG_OPEN_TARGET) {
    const url = (message as { url?: unknown }).url;
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      sendResponse({ ok: false });
      return false;
    }
    void chrome.tabs.create({ url, active: true }).then(
      () => sendResponse({ ok: true }),
      () => sendResponse({ ok: false }),
    );
    return true;
  }

  return false;
});
