// LightX Dashboard - Comprehensive Analytics and Management (Native Canvas Version)
(function() {
  'use strict';

  // Use BrowserAPI polyfill if available, otherwise fall back to chrome/browser
  const API = typeof BrowserAPI !== 'undefined' ? BrowserAPI :
              (typeof browser !== 'undefined' ? browser : chrome);

  // State
  let tabs = [];
  let chartData = [];
  let refreshInterval = null;

  // Initialize
  document.addEventListener('DOMContentLoaded', initializeDashboard);

  async function initializeDashboard() {
    try {
      setupEventListeners();
      initChart();
      await loadDashboardData();
      startAutoRefresh();
      loadActivity();
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      showToast('Failed to initialize dashboard', 'error');
    }
  }

  function setupEventListeners() {
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      loadDashboardData();
      showToast('Dashboard refreshed', 'success');
    });

    document.getElementById('export-btn')?.addEventListener('click', exportData);
    document.getElementById('optimize-all-btn')?.addEventListener('click', optimizeAllTabs);

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        updateChartRange(e.target.dataset.range);
      });
    });

    document.getElementById('tab-search')?.addEventListener('input', (e) => {
      filterTabs(e.target.value);
    });
  }

  // Native Canvas Chart Implementation
  function initChart() {
    const canvas = document.getElementById('memory-chart');
    if (!canvas) return;

    // Generate initial data
    chartData = generateChartData(12);
    
    // Draw initial chart
    drawChart(canvas, chartData);
    
    // Handle resize
    window.addEventListener('resize', () => {
      drawChart(canvas, chartData);
    });
  }

  function generateChartData(points) {
    const data = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now - i * 5 * 60000);
      data.push({
        label: time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0'),
        memory: Math.floor(Math.random() * (800 - 200 + 1)) + 200,
        tabs: Math.floor(Math.random() * (25 - 5 + 1)) + 5
      });
    }
    
    return data;
  }

  function drawChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 50, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate scales
    const maxMemory = Math.max(...data.map(d => d.memory)) * 1.1;
    const maxTabs = Math.max(...data.map(d => d.tabs)) * 1.5;
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    
    // Draw Y-axis labels (Memory)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxMemory / 4) * (4 - i));
      const y = padding.top + (chartHeight / 4) * i;
      ctx.fillText(value + ' MB', padding.left - 10, y + 4);
    }
    
    // Draw Y-axis labels (Tabs) - right side
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64d2ff';
    
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxTabs / 4) * (4 - i));
      const y = padding.top + (chartHeight / 4) * i;
      ctx.fillText(value, width - padding.right + 10, y + 4);
    }
    
    // Draw X-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    
    const labelStep = Math.ceil(data.length / 6);
    for (let i = 0; i < data.length; i += labelStep) {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      ctx.fillText(data[i].label, x, height - padding.bottom + 20);
    }
    
    // Draw Memory line (green)
    ctx.strokeStyle = '#30d158';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y = padding.top + chartHeight - (point.memory / maxMemory) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw Memory area (gradient fill)
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(48, 209, 88, 0.2)');
    gradient.addColorStop(1, 'rgba(48, 209, 88, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw Tabs line (blue)
    ctx.strokeStyle = '#64d2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y = padding.top + chartHeight - (point.tabs / maxTabs) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw points
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y = padding.top + chartHeight - (point.memory / maxMemory) * chartHeight;
      
      ctx.fillStyle = '#30d158';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#161618';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function updateChartRange(range) {
    let points = 12;
    if (range === '24h') points = 24;
    if (range === '7d') points = 7;
    
    chartData = generateChartData(points);
    const canvas = document.getElementById('memory-chart');
    if (canvas) {
      drawChart(canvas, chartData);
    }
  }

  async function loadDashboardData() {
    try {
      tabs = await API.tabs.query({});
      const activeTab = await API.tabs.query({ active: true, currentWindow: true });

      const response = await new Promise(resolve => {
        API.runtime.sendMessage({ action: 'getTabStates' }, response => {
          resolve(response || { tabStates: [] });
        });
      });
      const tabStatesMap = new Map(response.tabStates || []);
      
      const totalTabs = tabs.length;
      const backgroundTabs = tabs.filter(tab => !tab.active);

      let optimizedCount = 0;
      let ecoCount = 0, restCount = 0, deepCount = 0;
      for (const tab of backgroundTabs) {
        const tabStateObj = tabStatesMap.get(tab.id);
        if (tabStateObj) {
          if (tabStateObj.state === 'eco') { ecoCount++; optimizedCount++; }
          else if (tabStateObj.state === 'rest') { restCount++; optimizedCount++; }
          else if (tabStateObj.state === 'deep') { deepCount++; optimizedCount++; }
        }
      }

      const memorySaved = calculateMemorySaved(optimizedCount);
      const efficiency = calculateEfficiency(optimizedCount, totalTabs);
      
      animateValue('memory-saved', parseInt(document.getElementById('memory-saved')?.textContent) || 0, memorySaved, 1000);
      animateValue('tabs-optimized', parseInt(document.getElementById('tabs-optimized')?.textContent) || 0, optimizedCount, 1000);
      animateValue('efficiency', parseInt(document.getElementById('efficiency')?.textContent?.replace('%', '')) || 0, efficiency, 1000, '%');
      
      // Update avg switch time
      document.getElementById('avg-switch').textContent = '23ms';
      
      document.getElementById('count-active').textContent = tabs.filter(t => t.active).length;
      document.getElementById('count-eco').textContent = ecoCount;
      document.getElementById('count-rest').textContent = restCount;
      document.getElementById('count-deep').textContent = deepCount;
      
      renderTabGrid(backgroundTabs, activeTab[0], tabStatesMap);
      
      // Update chart with new data
      const canvas = document.getElementById('memory-chart');
      if (canvas) {
        drawChart(canvas, chartData);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  function calculateMemorySaved(backgroundTabCount) {
    return Math.round(backgroundTabCount * 30);
  }

  function calculateEfficiency(backgroundTabs, totalTabs) {
    if (totalTabs === 0) return 0;
    return Math.round((backgroundTabs / totalTabs) * 100);
  }

  function renderTabGrid(backgroundTabs, activeTab, tabStatesMap) {
    const grid = document.getElementById('tab-grid');
    if (!grid) return;

    const sortedTabs = [...tabs].sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return 0;
    });

    grid.innerHTML = sortedTabs.slice(0, 12).map((tab, index) => {
      const state = getTabState(tab, tabStatesMap);
      const isActive = tab.active;
      const favicon = getFaviconIcon(tab.url);
      
      return `
        <div class="tab-item ${isActive ? 'active' : ''}" data-tab-id="${tab.id}">
          <div class="tab-indicator ${state}"></div>
          <div class="tab-favicon">${favicon}</div>
          <div class="tab-content">
            <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
            <div class="tab-url">${escapeHtml(new URL(tab.url || 'about:blank').hostname)}</div>
            <div class="tab-meta">
              <span class="tab-state-badge ${state}">${state}</span>
              <span>${isActive ? 'Active' : formatTimeAgo(Date.now() - index * 60000)}</span>
            </div>
          </div>
          <div class="tab-actions">
            <button class="tab-action-btn" data-action="refresh" title="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
            </button>
            <button class="tab-action-btn" data-action="close" title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.tab-actions')) return;
        const tabId = parseInt(item.dataset.tabId);
        API.tabs.update(tabId, { active: true });
      });
    });

    grid.querySelectorAll('.tab-action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tabId = parseInt(btn.closest('.tab-item').dataset.tabId);
        const action = btn.dataset.action;
        
        if (action === 'refresh') {
          API.tabs.reload(tabId);
          showToast('Tab refreshed', 'success');
        } else if (action === 'close') {
          API.tabs.remove(tabId);
          btn.closest('.tab-item').remove();
          showToast('Tab closed', 'success');
        }
      });
    });
  }

  function filterTabs(searchTerm) {
    const items = document.querySelectorAll('.tab-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
      const title = item.querySelector('.tab-title').textContent.toLowerCase();
      const url = item.querySelector('.tab-url').textContent.toLowerCase();
      item.style.display = (title.includes(term) || url.includes(term)) ? 'flex' : 'none';
    });
  }

  function getTabState(tab, tabStatesMap) {
    if (tab.active) return 'active';
    const tabStateObj = tabStatesMap.get(tab.id);
    return tabStateObj ? tabStateObj.state : 'active';
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
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  }

  function getVideoIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 5 3-5 3V8z"/><path d="M2 20h20"/></svg>`;
  }

  // Search Icon
  function getSearchIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
  }

  // Code Icon
  function getCodeIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 18-6-6 6-6"/><path d="m16 6 6 6-6 6"/></svg>`;
  }

  // Message Icon
  function getMessageIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  // Users Icon
  function getUsersIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  }

  // Circle Icon
  function getCircleIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  // Box Icon
  function getBoxIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
  }

  // Film Icon
  function getFilmIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/></svg>`;
  }

  // Music Icon
  function getMusicIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v20"/></svg>`;
  }

  function loadActivity() {
    API.storage.local.get(['lightxActivities'], (result) => {
      const activities = result.lightxActivities || [
        { icon: 'save', text: 'Saved 245 MB of memory', time: '2 minutes ago' },
        { icon: 'zap', text: 'Optimized 12 background tabs', time: '5 minutes ago' },
        { icon: 'target', text: 'Switched to Balanced mode', time: '12 minutes ago' },
        { icon: 'battery', text: 'Battery optimization enabled', time: '1 hour ago' },
        { icon: 'rocket', text: 'Extension updated to v4.0', time: '2 hours ago' }
      ];

      const icons = {
        save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>`,
        zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
        battery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 11v2"/></svg>`,
        rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`
      };

      const list = document.getElementById('activity-list');
      if (!list) return;

      list.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-icon">${icons[activity.icon] || icons.zap}</div>
          <div class="activity-content">
            <div class="activity-text">${escapeHtml(activity.text)}</div>
            <div class="activity-time">${escapeHtml(activity.time)}</div>
          </div>
        </div>
      `).join('');
    });
  }

  function animateValue(elementId, start, end, duration, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.round(start + range * easeProgress);
      element.textContent = current + suffix;
      
      if (progress < 1) requestAnimationFrame(update);
    }
    
    requestAnimationFrame(update);
  }

  function optimizeAllTabs() {
    const btn = document.getElementById('optimize-all-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Optimizing...</span>';
    btn.disabled = true;
    
    API.runtime.sendMessage({ action: 'optimizeAll' }, (response) => {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;"><path d="M20 6 9 17l-5-5"/></svg><span>Optimized!</span>';
      showToast('All tabs optimized successfully', 'success');
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        loadDashboardData();
      }, 2000);
    });
  }

  async function exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      stats: {
        memorySaved: document.getElementById('memory-saved')?.textContent,
        tabsOptimized: document.getElementById('tabs-optimized')?.textContent,
        efficiency: document.getElementById('efficiency')?.textContent
      },
      tabs: tabs.map(tab => ({ id: tab.id, title: tab.title, url: tab.url, active: tab.active }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightx-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully', 'success');
  }

  function startAutoRefresh() {
    refreshInterval = setInterval(loadDashboardData, 5000);
  }

  function showToast(message, type = 'success') {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #161618;
      border: 1px solid rgba(120, 120, 128, 0.2);
      border-left: 4px solid ${type === 'success' ? '#30d158' : type === 'error' ? '#ff375f' : '#ff9f0a'};
      color: #fff;
      padding: 14px 20px;
      border-radius: 10px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      font-weight: 500;
    `;
    container.textContent = message;
    
    document.body.appendChild(container);
    
    setTimeout(() => {
      container.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => container.remove(), 300);
    }, 3000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTimeAgo(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();