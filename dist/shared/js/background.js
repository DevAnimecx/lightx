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
 * LightX Invisible Mode - Background Script (V2/V3 Compatible)
 * Universal Service Worker / Event Page
 */

(function() {
  'use strict';

  // Use BrowserAPI polyfill if available, otherwise fall back to chrome/browser
  const API = typeof BrowserAPI !== 'undefined' ? BrowserAPI : 
              (typeof browser !== 'undefined' ? browser : chrome);

  // Global state
  const state = {
    mode: 'balanced',
    tabStates: new Map(),
    settings: {
      ecoDelay: 60000,      // 1 minute
      restDelay: 180000,    // 3 minutes  
      deepDelay: 600000,    // 10 minutes
      adaptiveMode: true
    }
  };

  // Initialize
  function initialize() {
    console.log('[LightX] © 2026 Blackvault Inc. - Service worker initialized');
    loadSettings();
    setupTabListeners();
    setupAlarmListeners();
  }

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await API.storage.local.get(['lightxMode', 'lightxSettings']);
      if (result.lightxMode) {
        state.mode = result.lightxMode;
      }
      if (result.lightxSettings) {
        Object.assign(state.settings, result.lightxSettings);
      }
    } catch (error) {
      console.error('[LightX] Error loading settings:', error);
    }
  }

  // Set up tab event listeners
  function setupTabListeners() {
    API.tabs.onActivated.addListener(handleTabActivated);
    API.tabs.onUpdated.addListener(handleTabUpdated);
    API.tabs.onRemoved.addListener(handleTabRemoved);
    
    if (API.windows && API.windows.onFocusChanged) {
      API.windows.onFocusChanged.addListener(handleWindowFocusChanged);
    }
  }

  // Handle tab activation
  async function handleTabActivated(activeInfo) {
    const { tabId } = activeInfo;
    await setTabState(tabId, 'active');
    scheduleTabOptimization();
  }

  // Handle tab updates
  function handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      if (!tab.active) {
        scheduleTabStateChange(tabId, 'eco', state.settings.ecoDelay);
      }
    }
  }

  // Handle tab removal
  function handleTabRemoved(tabId, removeInfo) {
    state.tabStates.delete(tabId);
    clearTabTimers(tabId);
  }

  // Handle window focus changes
  function handleWindowFocusChanged(windowId) {
    if (windowId === -1 || windowId === API.windows.WINDOW_ID_NONE) {
      optimizeAllBackgroundTabs();
    }
  }

  // Set up alarm listeners
  function setupAlarmListeners() {
    if (!API.alarms) return;
    
    API.alarms.create('lightx-optimization', { periodInMinutes: 1 });
    
    API.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'lightx-optimization') {
        performOptimization();
      } else if (alarm.name.startsWith('tab_')) {
        const parts = alarm.name.split('_');
        const tabId = parseInt(parts[1]);
        const newState = parts[2];
        if (tabId && newState) {
          setTabState(tabId, newState);
        }
      }
    });
  }

  // Set tab state
  async function setTabState(tabId, newState) {
    try {
      await API.tabs.sendMessage(tabId, {
        action: 'setState',
        state: newState
      });
      
      state.tabStates.set(tabId, {
        state: newState,
        timeInState: 0,
        lastUpdate: Date.now()
      });
      
      clearTabTimers(tabId);
    } catch (error) {
      // Tab might not have content script loaded
      console.log(`[LightX] Could not set state for tab ${tabId}`);
    }
  }

  // Schedule tab state change
  function scheduleTabStateChange(tabId, newState, delay) {
    if (!API.alarms) return;
    
    const timerKey = `tab_${tabId}_${newState}`;
    API.alarms.create(timerKey, { when: Date.now() + delay });
  }

  // Clear all timers for a tab
  function clearTabTimers(tabId) {
    if (!API.alarms) return;
    
    ['eco', 'rest', 'deep'].forEach(state => {
      API.alarms.clear(`tab_${tabId}_${state}`);
    });
  }

  // Main optimization logic
  async function performOptimization() {
    try {
      const tabs = await API.tabs.query({});
      const activeTab = tabs.find(t => t.active);
      
      for (const tab of tabs) {
        if (tab.id === activeTab?.id) continue;
        if (tab.discarded) continue;
        if (tab.pinned) continue;
        if (tab.audible) continue;
        
        const tabState = state.tabStates.get(tab.id);
        if (shouldOptimizeTab(tab, tabState)) {
          await optimizeTab(tab.id);
        }
      }
    } catch (error) {
      console.error('[LightX] Optimization error:', error);
    }
  }

  // Check if tab should be optimized
  function shouldOptimizeTab(tab, tabState) {
    const protectedPatterns = [
      /youtube\.com/,
      /netflix\.com/,
      /spotify\.com/,
      /meet\.google\.com/,
      /zoom\.us/,
      /teams\.microsoft\.com/
    ];
    
    for (const pattern of protectedPatterns) {
      if (pattern.test(tab.url || '')) {
        return false;
      }
    }
    
    switch (state.mode) {
      case 'eco':
        return tabState?.timeInState > 300000;
      case 'balanced':
        return tabState?.timeInState > 120000;
      case 'performance':
        return tabState?.timeInState > 30000;
      default:
        return false;
    }
  }

  // Optimize a single tab
  async function optimizeTab(tabId) {
    try {
      await API.tabs.sendMessage(tabId, {
        action: 'setState',
        state: 'eco'
      });
      
      scheduleTabStateChange(tabId, 'rest', state.settings.restDelay);
      
      const tabState = state.tabStates.get(tabId) || {};
      tabState.state = 'eco';
      tabState.optimizedAt = Date.now();
      state.tabStates.set(tabId, tabState);
    } catch (error) {
      console.log(`[LightX] Could not optimize tab ${tabId}:`, error.message);
    }
  }

  // Optimize all background tabs
  async function optimizeAllBackgroundTabs() {
    try {
      const tabs = await API.tabs.query({ active: false });
      
      for (const tab of tabs) {
        if (!tab.pinned && !tab.audible) {
          await optimizeTab(tab.id);
        }
      }
    } catch (error) {
      console.error('[LightX] Error optimizing background tabs:', error);
    }
  }

  // Schedule optimization for all non-active tabs
  async function scheduleTabOptimization() {
    try {
      const tabs = await API.tabs.query({ active: false });
      
      for (const tab of tabs) {
        if (!tab.pinned && !tab.audible) {
          scheduleTabStateChange(tab.id, 'eco', state.settings.ecoDelay);
        }
      }
    } catch (error) {
      console.error('[LightX] Error scheduling optimization:', error);
    }
  }

  // Handle messages
  API.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action } = message;
    
    switch (action) {
      case 'setMode':
        state.mode = message.mode;
        API.storage.local.set({ lightxMode: message.mode });
        sendResponse({ success: true, mode: state.mode });
        break;
        
      case 'getMode':
        sendResponse({ mode: state.mode });
        break;
        
      case 'getStats':
        getStats().then(stats => sendResponse(stats));
        return true;
        
      case 'optimizeAll':
        optimizeAllBackgroundTabs().then(() => {
          sendResponse({ success: true });
        });
        return true;
        
      case 'contentScriptReady':
        console.log(`[LightX] Content script ready: ${message.url}`);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true;
  });

  // Get extension stats
  async function getStats() {
    try {
      const tabs = await API.tabs.query({});
      const activeTabs = tabs.filter(t => t.active).length;
      const optimizedTabs = Array.from(state.tabStates.values()).filter(s => s.state !== 'active').length;
      
      return {
        totalTabs: tabs.length,
        activeTabs: activeTabs,
        optimizedTabs: optimizedTabs,
        mode: state.mode
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Initialize on load
  if (API.runtime.onStartup) {
    API.runtime.onStartup.addListener(initialize);
  }
  if (API.runtime.onInstalled) {
    API.runtime.onInstalled.addListener(initialize);
  }
  
  initialize();
  console.log('[LightX] © 2026 Blackvault Inc. - Service worker loaded');

})();