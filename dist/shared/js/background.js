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
      adaptiveMode: true,
      mediaProtection: 'when_playing',
      formProtection: 'when_typing',
      showNotifications: true
    },
    domainRules: []
  };

  const defaultRules = [
    { domain: 'youtube.com', preset: 'streaming', mode: 'never', media: 'always', form: 'always' },
    { domain: 'github.com', preset: 'work', mode: 'balanced', media: 'when_playing', form: 'always' },
    { domain: 'reddit.com', preset: 'social', mode: 'balanced', media: 'when_playing', form: 'when_typing' }
  ];

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await API.storage.local.get(['lightxMode', 'lightxSettings', 'lightxDomainRules']);
      if (result.lightxMode) {
        state.mode = result.lightxMode;
      }
      if (result.lightxSettings) {
        Object.assign(state.settings, result.lightxSettings);
      }
      if (result.lightxDomainRules) {
        state.domainRules = result.lightxDomainRules;
      } else {
        state.domainRules = [...defaultRules];
        await API.storage.local.set({ lightxDomainRules: state.domainRules });
      }
    } catch (error) {
      console.error('[LightX] Error loading settings:', error);
    }
  }

  // Setup storage change listeners
  API.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.lightxMode) {
        state.mode = changes.lightxMode.newValue;
      }
      if (changes.lightxSettings) {
        Object.assign(state.settings, changes.lightxSettings.newValue);
      }
      if (changes.lightxDomainRules) {
        state.domainRules = changes.lightxDomainRules.newValue;
      }
    }
  });

  // Helper for matching domain
  function getDomain(urlStr) {
    try {
      return new URL(urlStr).hostname;
    } catch (e) {
      return '';
    }
  }

  function matchesDomainRule(tabDomain, ruleDomain) {
    if (!tabDomain || !ruleDomain) return false;
    tabDomain = tabDomain.toLowerCase();
    ruleDomain = ruleDomain.toLowerCase();
    if (tabDomain === ruleDomain) return true;
    if (ruleDomain.startsWith('*.')) {
      const suffix = ruleDomain.slice(2);
      return tabDomain.endsWith('.' + suffix) || tabDomain === suffix;
    }
    return tabDomain.endsWith('.' + ruleDomain);
  }

  // Log activities to storage
  function logActivity(text, icon = 'zap') {
    try {
      API.storage.local.get(['lightxActivities'], (result) => {
        const activities = result.lightxActivities || [];
        activities.unshift({
          icon: icon,
          text: text,
          time: 'Just now'
        });
        if (activities.length > 20) {
          activities.pop();
        }
        API.storage.local.set({ lightxActivities: activities });
      });
    } catch (e) {
      console.error('Error logging activity:', e);
    }
  }

  // Set up top-level event listeners
  API.tabs.onActivated.addListener(handleTabActivated);
  API.tabs.onUpdated.addListener(handleTabUpdated);
  API.tabs.onRemoved.addListener(handleTabRemoved);
  if (API.windows && API.windows.onFocusChanged) {
    API.windows.onFocusChanged.addListener(handleWindowFocusChanged);
  }
  if (API.alarms) {
    API.alarms.onAlarm.addListener(handleAlarm);
  }
  API.runtime.onMessage.addListener(handleMessage);

  // Handle tab activation
  async function handleTabActivated(activeInfo) {
    const { tabId } = activeInfo;
    await setTabState(tabId, 'active');
    await scheduleTabOptimization();
  }

  // Handle tab updates
  function handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      if (!tab.active) {
        const tabState = state.tabStates.get(tabId);
        if (!tabState || tabState.state === 'active') {
          scheduleTabStateChange(tabId, 'eco', state.settings.ecoDelay);
        }
      } else {
        setTabState(tabId, 'active');
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

  // Handle alarms
  function handleAlarm(alarm) {
    const alarmName = alarm.name;
    if (alarmName === 'lightx-optimization') {
      performOptimization();
    } else if (alarmName.startsWith('tab_')) {
      const parts = alarmName.split('_');
      const tabId = parseInt(parts[1]);
      const newState = parts[2];
      if (tabId && newState) {
        setTabState(tabId, newState);
      }
    }
  }

  // Handle messaging
  function handleMessage(message, sender, sendResponse) {
    const { action } = message;
    
    switch (action) {
      case 'setMode':
        state.mode = message.mode;
        API.storage.local.set({ lightxMode: message.mode });
        logActivity(`Switched to ${message.mode} mode`, 'target');
        sendResponse({ success: true, mode: state.mode });
        break;

      case 'getMode':
        sendResponse({ mode: state.mode });
        break;

      case 'getStats':
        getStats().then(stats => sendResponse(stats));
        return true; // Async response

      case 'getTabStates':
        sendResponse({ tabStates: Array.from(state.tabStates.entries()) });
        break;

      case 'optimizeAll':
        optimizeAllBackgroundTabs().then(() => {
          logActivity('Optimized all background tabs', 'zap');
          sendResponse({ success: true });
        });
        return true; // Async response

      case 'contentScriptReady':
        console.log(`[LightX] Content script ready: ${message.url}`);
        const tabDomain = getDomain(message.url);
        const rule = (state.domainRules || []).find(r => matchesDomainRule(tabDomain, r.domain));
        sendResponse({ success: true, rule: rule, settings: state.settings, mode: state.mode });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true;
  }

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
      console.error('[LightX] Error getting stats:', error);
      return { error: error.message };
    }
  }

  // Set tab state
  async function setTabState(tabId, newState) {
    try {
      clearTabTimers(tabId);

      try {
        await API.tabs.sendMessage(tabId, {
          action: 'setState',
          state: newState
        });
      } catch (e) {
        // Content script might not be injected/ready yet
      }
      
      state.tabStates.set(tabId, {
        state: newState,
        timeInState: 0,
        lastUpdate: Date.now()
      });

      if (newState === 'eco') {
        scheduleTabStateChange(tabId, 'rest', state.settings.restDelay);
      } else if (newState === 'rest') {
        scheduleTabStateChange(tabId, 'deep', state.settings.deepDelay);
      }
      
    } catch (error) {
      console.log(`[LightX] Could not set state ${newState} for tab ${tabId}`);
    }
  }

  // Schedule state change
  function scheduleTabStateChange(tabId, newState, delay) {
    if (!API.alarms) return;
    const timerKey = `tab_${tabId}_${newState}`;
    API.alarms.create(timerKey, {
      when: Date.now() + delay
    });
  }

  // Clear all timers for a tab
  function clearTabTimers(tabId) {
    if (!API.alarms) return;
    API.alarms.clear(`tab_${tabId}_eco`);
    API.alarms.clear(`tab_${tabId}_rest`);
    API.alarms.clear(`tab_${tabId}_deep`);
  }

  // Periodic background check optimization logic
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
    const tabDomain = getDomain(tab.url);
    const rule = (state.domainRules || []).find(r => matchesDomainRule(tabDomain, r.domain));

    if (rule) {
      if (rule.mode === 'never') return false;

      const targetMode = rule.mode || state.mode;
      const timeInState = tabState ? (Date.now() - tabState.lastUpdate) : 0;

      switch (targetMode) {
        case 'eco':
          return timeInState > 300000;
        case 'balanced':
          return timeInState > 120000;
        case 'performance':
          return timeInState > 30000;
        default:
          return false;
      }
    }

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
    
    const timeInState = tabState ? (Date.now() - tabState.lastUpdate) : 0;

    switch (state.mode) {
      case 'eco':
        return timeInState > 300000;
      case 'balanced':
        return timeInState > 120000;
      case 'performance':
        return timeInState > 30000;
      default:
        return false;
    }
  }

  async function optimizeTab(tabId) {
    await setTabState(tabId, 'eco');
  }

  // Optimize all background tabs
  async function optimizeAllBackgroundTabs() {
    try {
      const tabs = await API.tabs.query({ active: false });
      
      let count = 0;
      for (const tab of tabs) {
        if (!tab.pinned && !tab.audible) {
          await optimizeTab(tab.id);
          count++;
        }
      }
      if (count > 0) {
        logActivity(`Optimized ${count} background tabs`, 'zap');
      }
    } catch (error) {
      console.error('[LightX] Error optimizing background tabs:', error);
    }
  }

  // Schedule optimization for newly quiet background tabs
  async function scheduleTabOptimization() {
    try {
      const tabs = await API.tabs.query({ active: false });
      
      for (const tab of tabs) {
        if (tab.pinned || tab.audible) continue;

        const tabState = state.tabStates.get(tab.id);
        if (!tabState || tabState.state === 'active') {
          scheduleTabStateChange(tab.id, 'eco', state.settings.ecoDelay);
        }
      }
    } catch (error) {
      console.error('[LightX] Error scheduling optimization:', error);
    }
  }

  // Initialize on load
  async function initialize() {
    console.log('[LightX] Service worker initialized');
    await loadSettings();
    if (API.alarms) {
      API.alarms.create('lightx-optimization', { periodInMinutes: 1 });
    }
  }

  if (API.runtime.onStartup) {
    API.runtime.onStartup.addListener(initialize);
  }
  if (API.runtime.onInstalled) {
    API.runtime.onInstalled.addListener(initialize);
  }

  initialize();

  console.log('[LightX] Service worker loaded');

})();