// LightX Settings Page - All functionality
document.addEventListener('DOMContentLoaded', function() {
  let currentDomainRules = [];
  let editingDomain = null;
  let currentSection = 'domains';

  initializeSettings();

  async function initializeSettings() {
    try {
      await loadDomainRules();
      await loadGeneralSettings();
      setupEventListeners();
      setupNavigation();
    } catch (error) {
      console.error('LightX Settings: Initialization error:', error);
      showToast('Failed to load settings', 'error');
    }
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        switchSection(section);
      });
    });
  }

  function switchSection(section) {
    currentSection = section;
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-section="${section}"]`).classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    const titles = {
      'domains': 'Domain Rules',
      'presets': 'Quick Presets',
      'general': 'General Settings',
      'advanced': 'Advanced Settings'
    };
    document.getElementById('page-title').textContent = titles[section];
  }

  function setupEventListeners() {
    document.getElementById('add-domain-btn').addEventListener('click', addDomainRule);
    
    document.querySelectorAll('.btn-apply').forEach(btn => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });
    
    document.querySelectorAll('.mode-option').forEach(btn => {
      btn.addEventListener('click', () => setGlobalMode(btn.dataset.mode));
    });
    
    document.getElementById('media-protection').addEventListener('change', saveGeneralSettings);
    document.getElementById('form-protection').addEventListener('change', saveGeneralSettings);
    document.getElementById('show-notifications').addEventListener('change', saveGeneralSettings);
    document.getElementById('adaptive-mode').addEventListener('change', saveGeneralSettings);
    
    ['time-eco', 'time-rest', 'time-deep'].forEach(id => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(`value-${id.split('-')[1]}`);
      
      slider.addEventListener('input', () => {
        valueDisplay.textContent = formatTime(slider.value);
      });
      
      slider.addEventListener('change', saveGeneralSettings);
    });
    
    document.getElementById('save-btn').addEventListener('click', saveAllSettings);
    document.getElementById('export-btn').addEventListener('click', exportSettings);
    document.getElementById('import-btn').addEventListener('click', importSettings);
    document.getElementById('reset-btn').addEventListener('click', resetSettings);
    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-edit').addEventListener('click', closeModal);
    document.getElementById('save-edit').addEventListener('click', saveDomainEdit);
  }

  async function loadDomainRules() {
    try {
      currentDomainRules = [
        { domain: 'youtube.com', preset: 'streaming', mode: 'never', media: 'always', form: 'always' },
        { domain: 'github.com', preset: 'work', mode: 'balanced', media: 'when_playing', form: 'always' },
        { domain: 'reddit.com', preset: 'social', mode: 'balanced', media: 'when_playing', form: 'when_typing' }
      ];
      renderDomainList();
    } catch (error) {
      console.error('Error loading domain rules:', error);
    }
  }

  function renderDomainList() {
    const list = document.getElementById('domain-list');
    const countBadge = document.getElementById('domain-count');
    
    countBadge.textContent = `${currentDomainRules.length} rule${currentDomainRules.length !== 1 ? 's' : ''}`;
    
    if (currentDomainRules.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </div>
          <p>No domain rules yet</p>
          <p class="empty-subtitle">Add rules above to customize behavior</p>
        </div>
      `;
      return;
    }
    
    list.innerHTML = currentDomainRules.map((rule, index) => `
      <div class="domain-item" data-index="${index}">
        <div class="domain-info">
          <div class="domain-name">${escapeHtml(rule.domain)}</div>
          <div class="domain-meta">
            ${getPresetIcon(rule.preset)} ${getPresetName(rule.preset)} • 
            Mode: ${rule.mode} • 
            Media: ${rule.media}
          </div>
        </div>
        <div class="domain-actions">
          <button class="icon-btn" data-action="edit" data-index="${index}" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button class="icon-btn delete" data-action="delete" data-index="${index}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
    
    list.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const index = parseInt(e.currentTarget.dataset.index);
        
        if (action === 'edit') {
          editDomain(index);
        } else if (action === 'delete') {
          deleteDomain(index);
        }
      });
    });
  }

  function getPresetIcon(preset) {
    const icons = {
      streaming: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m10 8 5 3-5 3V8z"/><path d="M2 20h20"/></svg>`,
      banking: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h12"/><path d="M6 12h12"/><path d="M6 16h12"/></svg>`,
      work: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>`,
      social: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      shopping: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
      news: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
      custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
    };
    return icons[preset] || icons.custom;
  }

  function getPresetName(preset) {
    const names = {
      streaming: 'Streaming & Media',
      banking: 'Banking & Finance',
      work: 'Work & Productivity',
      social: 'Social Media',
      shopping: 'Shopping',
      news: 'News & Articles',
      custom: 'Custom'
    };
    return names[preset] || 'Custom';
  }

  async function addDomainRule() {
    const domainInput = document.getElementById('new-domain');
    const presetSelect = document.getElementById('new-domain-preset');
    
    const domain = domainInput.value.trim();
    const preset = presetSelect.value;
    
    if (!domain) {
      showToast('Please enter a domain', 'error');
      return;
    }
    
    if (!preset) {
      showToast('Please select a preset', 'error');
      return;
    }
    
    const newRule = {
      domain: domain,
      preset: preset,
      mode: preset === 'never' ? 'never' : 'balanced',
      media: 'when_playing',
      form: 'when_typing'
    };
    
    currentDomainRules.push(newRule);
    domainInput.value = '';
    presetSelect.value = '';
    renderDomainList();
    showToast(`Added rule for ${domain}`, 'success');
  }

  function editDomain(index) {
    editingDomain = index;
    const rule = currentDomainRules[index];
    
    document.getElementById('edit-domain').value = rule.domain;
    document.getElementById('edit-mode').value = rule.mode;
    document.getElementById('edit-media').value = rule.media;
    document.getElementById('edit-form').value = rule.form;
    
    document.getElementById('edit-modal').classList.add('active');
  }

  function saveDomainEdit() {
    if (editingDomain === null) return;
    
    currentDomainRules[editingDomain] = {
      ...currentDomainRules[editingDomain],
      mode: document.getElementById('edit-mode').value,
      media: document.getElementById('edit-media').value,
      form: document.getElementById('edit-form').value
    };
    
    renderDomainList();
    closeModal();
    showToast('Domain rule updated', 'success');
  }

  function deleteDomain(index) {
    if (!confirm('Delete this domain rule?')) return;
    
    const domain = currentDomainRules[index].domain;
    currentDomainRules.splice(index, 1);
    renderDomainList();
    showToast(`Deleted rule for ${domain}`, 'success');
  }

  function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingDomain = null;
  }

  async function applyPreset(presetName) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        showToast('No active tab found', 'error');
        return;
      }
      
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      const existingIndex = currentDomainRules.findIndex(r => r.domain === domain);
      
      const newRule = {
        domain: domain,
        preset: presetName,
        mode: presetName === 'streaming' || presetName === 'banking' ? 'never' : 'balanced',
        media: presetName === 'streaming' ? 'always' : 'when_playing',
        form: presetName === 'banking' ? 'always' : 'when_typing'
      };
      
      if (existingIndex >= 0) {
        currentDomainRules[existingIndex] = newRule;
      } else {
        currentDomainRules.push(newRule);
      }
      
      renderDomainList();
      showToast(`Applied ${getPresetName(presetName)} to ${domain}`, 'success');
    } catch (error) {
      showToast('Failed to apply preset', 'error');
    }
  }

  async function loadGeneralSettings() {
    try {
      const settings = {
        mode: 'balanced',
        mediaProtection: 'when_playing',
        formProtection: 'when_typing',
        showNotifications: true,
        adaptiveMode: true,
        timing: { eco: 60, rest: 180, deep: 600 }
      };
      
      document.getElementById('media-protection').value = settings.mediaProtection;
      document.getElementById('form-protection').value = settings.formProtection;
      document.getElementById('show-notifications').checked = settings.showNotifications;
      document.getElementById('adaptive-mode').checked = settings.adaptiveMode;
      
      document.querySelectorAll('.mode-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === settings.mode);
      });
      
      document.getElementById('time-eco').value = settings.timing.eco;
      document.getElementById('time-rest').value = settings.timing.rest;
      document.getElementById('time-deep').value = settings.timing.deep;
      
      document.getElementById('value-eco').textContent = formatTime(settings.timing.eco);
      document.getElementById('value-rest').textContent = formatTime(settings.timing.rest);
      document.getElementById('value-deep').textContent = formatTime(settings.timing.deep);
    } catch (error) {
      console.error('Error loading general settings:', error);
    }
  }

  function setGlobalMode(mode) {
    document.querySelectorAll('.mode-option').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.mode-option[data-mode="${mode}"]`).classList.add('active');
    
    chrome.storage.local.set({ lightxMode: mode });
    showToast(`Switched to ${mode} mode`, 'success');
  }

  async function saveGeneralSettings() {
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(async () => {
      const settings = {
        mediaProtection: document.getElementById('media-protection').value,
        formProtection: document.getElementById('form-protection').value,
        showNotifications: document.getElementById('show-notifications').checked,
        adaptiveMode: document.getElementById('adaptive-mode').checked,
        timing: {
          eco: parseInt(document.getElementById('time-eco').value),
          rest: parseInt(document.getElementById('time-rest').value),
          deep: parseInt(document.getElementById('time-deep').value)
        }
      };
      
      await chrome.storage.local.set({ lightxSettings: settings });
    }, 500);
  }

  async function saveAllSettings() {
    try {
      await chrome.storage.local.set({ lightxDomainRules: currentDomainRules });
      await saveGeneralSettings();
      showToast('All settings saved', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    }
  }

  async function exportSettings() {
    const data = {
      domainRules: currentDomainRules,
      settings: await chrome.storage.local.get(['lightxSettings', 'lightxMode']),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightx-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Settings exported', 'success');
  }

  function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          
          if (data.domainRules) {
            currentDomainRules = data.domainRules;
            renderDomainList();
          }
          
          if (data.settings) {
            await chrome.storage.local.set(data.settings);
            await loadGeneralSettings();
          }
          
          showToast('Settings imported successfully', 'success');
        } catch (error) {
          showToast('Failed to import settings', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  async function resetSettings() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    
    currentDomainRules = [];
    await chrome.storage.local.remove(['lightxDomainRules', 'lightxSettings', 'lightxMode']);
    
    renderDomainList();
    await loadGeneralSettings();
    showToast('Settings reset to defaults', 'success');
  }

  async function clearAllData() {
    if (!confirm('Clear all LightX data? This will remove all settings and rules.')) return;
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    
    await chrome.storage.local.clear();
    currentDomainRules = [];
    renderDomainList();
    showToast('All data cleared', 'success');
  }

  function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});