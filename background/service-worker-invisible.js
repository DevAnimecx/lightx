// LightX Invisible Mode - Service Worker (Manifest V3)
// Orchestrates tab optimization without ES6 classes for compatibility

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
chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

function initialize() {
  console.log('[LightX] Service worker initialized');
  loadSettings();
  setupTabListeners();
  setupAlarmListeners();
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['lightxMode', 'lightxSettings']);
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
  // Tab activation
  chrome.tabs.onActivated.addListener(handleTabActivated);
  
  // Tab updates
  chrome.tabs.onUpdated.addListener(handleTabUpdated);
  
  // Tab removal
  chrome.tabs.onRemoved.addListener(handleTabRemoved);
  
  // Window focus
  chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);
}

// Handle tab activation
async function handleTabActivated(activeInfo) {
  const { tabId, windowId } = activeInfo;
  
  // Set new active tab to 'active' state
  await setTabState(tabId, 'active');
  
  // Schedule optimization for other tabs
  scheduleTabOptimization();
}

// Handle tab updates
function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    // Initialize tab state
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
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // All windows unfocused - can optimize more aggressively
    optimizeAllBackgroundTabs();
  }
}

// Set up alarm listeners for periodic optimization
function setupAlarmListeners() {
  chrome.alarms.create('lightx-optimization', { periodInMinutes: 1 });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'lightx-optimization') {
      performOptimization();
    }
  });
}

// Main optimization logic
async function performOptimization() {
  try {
    const tabs = await chrome.tabs.query({});
    const activeTab = tabs.find(t => t.active);
    
    for (const tab of tabs) {
      if (tab.id === activeTab?.id) continue; // Skip active tab
      if (tab.discarded) continue; // Skip already discarded
      if (tab.pinned) continue; // Skip pinned tabs
      if (tab.audible) continue; // Skip tabs playing audio
      
      const tabState = state.tabStates.get(tab.id);
      const shouldOptimize = shouldOptimizeTab(tab, tabState);
      
      if (shouldOptimize) {
        await optimizeTab(tab.id);
      }
    }
  } catch (error) {
    console.error('[LightX] Optimization error:', error);
  }
}

// Check if tab should be optimized
function shouldOptimizeTab(tab, tabState) {
  // Check URL patterns that should never be optimized
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
  
  // Check based on mode
  switch (state.mode) {
    case 'eco':
      // Light optimization - only very old tabs
      return tabState?.timeInState > 300000; // 5 minutes
    case 'balanced':
      // Balanced optimization
      return tabState?.timeInState > 120000; // 2 minutes
    case 'performance':
      // Aggressive optimization
      return tabState?.timeInState > 30000; // 30 seconds
    default:
      return false;
  }
}

// Optimize a single tab
async function optimizeTab(tabId) {
  try {
    // Send message to content script to change visual state
    await chrome.tabs.sendMessage(tabId, {
      action: 'setState',
      state: 'eco'
    });
    
    // Schedule deeper optimization
    scheduleTabStateChange(tabId, 'rest', state.settings.restDelay);
    
    // Update tab state
    const tabState = state.tabStates.get(tabId) || {};
    tabState.state = 'eco';
    tabState.optimizedAt = Date.now();
    state.tabStates.set(tabId, tabState);
    
  } catch (error) {
    // Content script not loaded or other error
    console.log(`[LightX] Could not optimize tab ${tabId}:`, error.message);
  }
}

// Set tab state
async function setTabState(tabId, newState) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'setState',
      state: newState
    });
    
    // Update tracking
    state.tabStates.set(tabId, {
      state: newState,
      timeInState: 0,
      lastUpdate: Date.now()
    });
    
    // Clear any scheduled optimizations
    clearTabTimers(tabId);
    
  } catch (error) {
    // Tab might not have content script loaded
    console.log(`[LightX] Could not set state for tab ${tabId}`);
  }
}

// Schedule a tab state change
function scheduleTabStateChange(tabId, newState, delay) {
  const timerKey = `tab_${tabId}_${newState}`;
  
  chrome.alarms.create(timerKey, {
    when: Date.now() + delay
  });
}

// Clear all timers for a tab
function clearTabTimers(tabId) {
  chrome.alarms.clear(`tab_${tabId}_eco`);
  chrome.alarms.clear(`tab_${tabId}_rest`);
  chrome.alarms.clear(`tab_${tabId}_deep`);
}

// Optimize all background tabs
async function optimizeAllBackgroundTabs() {
  try {
    const tabs = await chrome.tabs.query({ active: false });
    
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
    const tabs = await chrome.tabs.query({ active: false });
    
    for (const tab of tabs) {
      if (!tab.pinned && !tab.audible) {
        scheduleTabStateChange(tab.id, 'eco', state.settings.ecoDelay);
      }
    }
  } catch (error) {
    console.error('[LightX] Error scheduling optimization:', error);
  }
}

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action } = message;
  
  switch (action) {
    case 'setMode':
      state.mode = message.mode;
      chrome.storage.local.set({ lightxMode: message.mode });
      sendResponse({ success: true, mode: state.mode });
      break;
      
    case 'getMode':
      sendResponse({ mode: state.mode });
      break;
      
    case 'getStats':
      getStats().then(stats => sendResponse(stats));
      return true; // Async response
      
    case 'optimizeAll':
      optimizeAllBackgroundTabs().then(() => {
        sendResponse({ success: true });
      });
      return true; // Async response
      
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
    const tabs = await chrome.tabs.query({});
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

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  const alarmName = alarm.name;
  
  // Check if this is a tab state change alarm
  if (alarmName.startsWith('tab_')) {
    const parts = alarmName.split('_');
    const tabId = parseInt(parts[1]);
    const newState = parts[2];
    
    if (tabId && newState) {
      setTabState(tabId, newState);
    }
  }
});

// Initialize on load
initialize();

console.log('[LightX] Service worker loaded');