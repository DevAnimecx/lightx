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
 * LightX Extension Popup UI
 */

document.addEventListener('DOMContentLoaded', function() {
  // Use BrowserAPI polyfill if available, otherwise fall back to chrome/browser
  const API = typeof BrowserAPI !== 'undefined' ? BrowserAPI :
              (typeof browser !== 'undefined' ? browser : chrome);

  // State
  let currentMode = 'balanced';
  let refreshInterval = null;

  // Initialize
  initializePopup();

  async function initializePopup() {
    try {
      await loadCurrentMode();
      await loadStats();
      setupEventListeners();
      startAutoRefresh();
    } catch (error) {
      console.error('LightX Popup: Initialization error:', error);
      showErrorState();
    }
  }

  async function loadCurrentMode() {
    try {
      const result = await API.storage.local.get(['lightxMode']);
      currentMode = result.lightxMode || 'balanced';
      updateModeButtons();
    } catch (error) {
      console.error('LightX Popup: Error loading mode:', error);
    }
  }

  function updateModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`mode-${currentMode}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  async function loadStats() {
    try {
      const tabs = await API.tabs.query({});
      const activeTab = await API.tabs.query({ active: true, currentWindow: true });

      const response = await new Promise(resolve => {
        API.runtime.sendMessage({ action: 'getTabStates' }, response => {
          resolve(response || { tabStates: [] });
        });
      });
      
      const tabStatesMap = new Map(response.tabStates || []);
      const backgroundTabs = tabs.filter(tab => !tab.active);

      let optimizedCount = 0;
      for (const tab of backgroundTabs) {
        const tabStateObj = tabStatesMap.get(tab.id);
        if (tabStateObj && tabStateObj.state !== 'active') {
          optimizedCount++;
        }
      }

      const memoryEstimate = calculateMemoryEstimate(optimizedCount);
      
      updateStat('memory-saved', memoryEstimate);
      updateStat('tabs-count', optimizedCount);
      
      if (activeTab && activeTab[0]) {
        updateCurrentTab(activeTab[0]);
      }
      
      renderBackgroundTabs(backgroundTabs, tabStatesMap);
    } catch (error) {
      console.error('LightX Popup: Error loading stats:', error);
    }
  }

  function calculateMemoryEstimate(backgroundTabCount) {
    return Math.round(backgroundTabCount * 30);
  }

  function updateStat(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      animateValue(element, parseInt(element.textContent) || 0, value, 500);
    }
  }

  function animateValue(element, start, end, duration) {
    if (start === end) {
      element.textContent = end;
      return;
    }
    
    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);
    
    let startTime = new Date().getTime();
    let endTime = startTime + duration;
    let timer;
    
    def = function run() {
      let now = new Date().getTime();
      let remaining = Math.max((endTime - now) / duration, 0);
      let value = Math.round(end - (remaining * range));
      element.textContent = value;
      if (value == end) {
        clearInterval(timer);
      }
    }
    
    timer = setInterval(run, stepTime);
    run();
  }

  function updateCurrentTab(tab) {
    const titleEl = document.getElementById('current-title');
    const faviconEl = document.getElementById('current-favicon');
    
    if (titleEl) {
      titleEl.textContent = tab.title || 'Untitled';
    }
    
    if (faviconEl) {
      if (tab.favIconUrl) {
        faviconEl.innerHTML = `<img src="${tab.favIconUrl}" style="width: 20px; height: 20px; border-radius: 4px;" onerror="this.style.display='none'; this.parentNode.innerHTML='${getGlobeIcon()}'">`;
      } else {
        faviconEl.innerHTML = getFaviconIcon(tab.url);
      }
    }
  }

  function getFaviconIcon(url) {
    if (!url) return getGlobeIcon();
    if (url.includes('youtube')) return getVideoIcon();
    if (url.includes('google')) return getSearchIcon();
    if (url.includes('github')) return getCodeIcon();
    if (url.includes('twitter') || url.includes('x.com')) return getMessageIcon();
    if (url.includes('facebook')) return getUsersIcon();
    if (url.includes('reddit')) return getCircleIcon();
    if (url.includes('amazon')) return getBoxIcon();
    if (url.includes('netflix')) return getFilmIcon();
    if (url.includes('spotify')) return getMusicIcon();
    return getGlobeIcon();
  }

  function getGlobeIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  }

  function getVideoIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 5 3-5 3V8z"/><path d="M2 20h20"/></svg>`;
  }

  function getSearchIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
  }

  function getCodeIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="m8 18-6-6 6-6"/><path d="m16 6 6 6-6 6"/></svg>`;
  }

  function getMessageIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  function getUsersIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  }

  function getCircleIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  // Box Icon
  function getBoxIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
  }

  // Film Icon
  function getFilmIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/></svg>`;
  }

  // Music Icon
  function getMusicIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v20"/></svg>`;
  }

  function renderBackgroundTabs(tabs, tabStatesMap) {
    const listEl = document.getElementById('tabs-list');
    
    if (!listEl) return;
    
    if (tabs.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No background tabs</div>';
      return;
    }
    
    const sortedTabs = tabs.slice(0, 10);
    
    listEl.innerHTML = sortedTabs.map((tab, index) => {
      const tabStateObj = tabStatesMap.get(tab.id);
      const state = tabStateObj ? tabStateObj.state : 'active';
      const icon = getFaviconIcon(tab.url);
      
      return `
        <div class="tab-item" data-tab-id="${tab.id}" title="${escapeHtml(tab.title || 'Untitled')}">
          <div class="tab-dot ${state}"></div>
          <div class="tab-icon">${icon}</div>
          <div class="tab-details">
            <div class="tab-name">${escapeHtml(truncateText(tab.title || 'Untitled', 25))}</div>
            <div class="tab-state-text">${getStateLabel(state)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    listEl.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', async () => {
        const tabId = parseInt(item.dataset.tabId);
        try {
          await API.tabs.update(tabId, { active: true });
          window.close();
        } catch (error) {
          console.error('LightX Popup: Error switching tab:', error);
        }
      });
    });
  }

  function getStateLabel(state) {
    const labels = {
      'active': 'Active',
      'eco': 'Eco Mode',
      'rest': 'Rest Mode',
      'deep': 'Deep Sleep'
    };
    return labels[state] || state;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function getPageURL(pageName) {
    const manifest = API.runtime.getManifest();
    if (manifest.action && manifest.action.default_popup && manifest.action.default_popup.startsWith('html/')) {
      return API.runtime.getURL('html/' + pageName);
    }
    return API.runtime.getURL('ui/' + pageName);
  }

  function setupEventListeners() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mode = btn.dataset.mode;
        await setMode(mode);
      });
    });
    
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      API.tabs.create({ url: getPageURL('settings.html') });
      window.close();
    });
    
    document.getElementById('dashboard-btn')?.addEventListener('click', () => {
      API.tabs.create({ url: getPageURL('dashboard.html') });
      window.close();
    });
  }

  async function setMode(mode) {
    try {
      currentMode = mode;
      updateModeButtons();
      await API.storage.local.set({ lightxMode: mode });
      await API.runtime.sendMessage({ action: 'setMode', mode: mode });
      showModeChangeFeedback(mode);
    } catch (error) {
      console.error('LightX Popup: Error setting mode:', error);
    }
  }

  function showModeChangeFeedback(mode) {
    const modeNames = {
      'eco': 'Eco Mode',
      'balanced': 'Balanced Mode',
      'performance': 'Max Performance'
    };
    
    const statusText = document.getElementById('status-text');
    if (statusText) {
      const originalText = statusText.textContent;
      statusText.textContent = modeNames[mode] || mode;
      statusText.style.color = '#30d158';
      
      setTimeout(() => {
        statusText.textContent = originalText;
        statusText.style.color = '';
      }, 1500);
    }
  }

  function startAutoRefresh() {
    refreshInterval = setInterval(loadStats, 2000);
  }

  function showErrorState() {
    document.getElementById('memory-saved').textContent = '!';
    document.getElementById('tabs-count').textContent = '!';
    document.getElementById('current-title').textContent = 'Error loading data';
    document.getElementById('tabs-list').innerHTML = 
      '<div class="empty-state" style="color: #ff375f;">Failed to load data. Please refresh.</div>';
  }

  window.addEventListener('unload', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
});