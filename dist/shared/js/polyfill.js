/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║ BLACKVAULT INC. - PROPRIETARY & CONFIDENTIAL                                 ║
 * ║ Developed By: Adarsh Kushwah (Animecx)                                       ║
 * ║ Company: Blackvault Inc. -  Website: https://blackvaulttech.netlify.app/      ║
 * ║ Owner: Adarsh Kushwah -  GitHub: https://github.com/DevAnimecx                ║
 * ║ Product: Browser Extension (Multi-Store) -  Pricing: FREE (Premium Soon)      ║
 * ║                                                                              ║
 * ║ ⚠️  LICENSE: © 2026 Blackvault Inc. ALL RIGHTS RESERVED.                     ║
 * ║    UNAUTHORIZED COPYING, MODIFICATION, DISTRIBUTION STRICTLY PROHIBITED.     ║
 * ║    Subject to Blackvault Inc. Terms & Conditions. Legal action will be taken.║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Universal Browser Polyfill
 * Provides cross-browser compatibility for Chrome/Firefox/Edge/Opera
 */

(function() {
  'use strict';

  // Detect browser environment
  const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage;
  const isChrome = typeof chrome !== 'undefined' && chrome.runtime && !isFirefox;
  
  // Create unified API namespace
  window.BrowserAPI = {};
  
  if (isFirefox) {
    // Firefox - browser.* APIs return Promises natively
    window.BrowserAPI = browser;
    window.BrowserAPI.isFirefox = true;
    window.BrowserAPI.isChrome = false;
  } else {
    // Chrome/Edge - chrome.* APIs use callbacks, promisify them
    window.BrowserAPI = {};
    window.BrowserAPI.isFirefox = false;
    window.BrowserAPI.isChrome = true;
    
    // Promisify Chrome APIs
    const promisify = (api, method) => {
      return (...args) => {
        return new Promise((resolve, reject) => {
          api[method](...args, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
      };
    };
    
    // Runtime API
    window.BrowserAPI.runtime = {
      sendMessage: promisify(chrome.runtime, 'sendMessage'),
      onMessage: chrome.runtime.onMessage,
      getManifest: () => chrome.runtime.getManifest(),
      getURL: (path) => chrome.runtime.getURL(path),
      onStartup: chrome.runtime.onStartup,
      onInstalled: chrome.runtime.onInstalled
    };
    
    // Tabs API
    window.BrowserAPI.tabs = {
      query: promisify(chrome.tabs, 'query'),
      get: promisify(chrome.tabs, 'get'),
      update: promisify(chrome.tabs, 'update'),
      remove: promisify(chrome.tabs, 'remove'),
      reload: promisify(chrome.tabs, 'reload'),
      sendMessage: (tabId, message) => {
        return new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      },
      onActivated: chrome.tabs.onActivated,
      onUpdated: chrome.tabs.onUpdated,
      onRemoved: chrome.tabs.onRemoved
    };
    
    // Storage API
    window.BrowserAPI.storage = {
      local: {
        get: promisify(chrome.storage.local, 'get'),
        set: promisify(chrome.storage.local, 'set'),
        remove: promisify(chrome.storage.local, 'remove'),
        clear: promisify(chrome.storage.local, 'clear')
      },
      sync: chrome.storage.sync ? {
        get: promisify(chrome.storage.sync, 'get'),
        set: promisify(chrome.storage.sync, 'set'),
        remove: promisify(chrome.storage.sync, 'remove'),
        clear: promisify(chrome.storage.sync, 'clear')
      } : null
    };
    
    // Alarms API
    window.BrowserAPI.alarms = {
      create: promisify(chrome.alarms, 'create'),
      clear: promisify(chrome.alarms, 'clear'),
      clearAll: promisify(chrome.alarms, 'clearAll'),
      get: promisify(chrome.alarms, 'get'),
      getAll: promisify(chrome.alarms, 'getAll'),
      onAlarm: chrome.alarms.onAlarm
    };
    
    // Windows API
    window.BrowserAPI.windows = {
      getCurrent: promisify(chrome.windows, 'getCurrent'),
      getLastFocused: promisify(chrome.windows, 'getLastFocused'),
      onFocusChanged: chrome.windows.onFocusChanged
    };
    
    // Scripting API (V3 only)
    if (chrome.scripting) {
      window.BrowserAPI.scripting = {
        executeScript: promisify(chrome.scripting, 'executeScript'),
        insertCSS: promisify(chrome.scripting, 'insertCSS'),
        removeCSS: promisify(chrome.scripting, 'removeCSS')
      };
    }
    
    // Action/BrowserAction API
    if (chrome.action) {
      window.BrowserAPI.action = chrome.action;
    } else if (chrome.browserAction) {
      window.BrowserAPI.browserAction = chrome.browserAction;
    }
  }
  
  // Universal utilities
  window.BrowserAPI.getBrowserInfo = function() {
    return {
      isFirefox: window.BrowserAPI.isFirefox,
      isChrome: window.BrowserAPI.isChrome,
      name: window.BrowserAPI.isFirefox ? 'Firefox' : 'Chrome/Edge',
      manifestVersion: window.BrowserAPI.runtime.getManifest().manifest_version
    };
  };
  
  // Log initialization
  console.log('[LightX] Polyfill initialized:', window.BrowserAPI.getBrowserInfo());
  
})();