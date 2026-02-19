// LightX Invisible Mode - Content Script (Visual Effects Only)
// This script NEVER freezes JavaScript - it only applies CSS visual effects

(function() {
  'use strict';

  // State management
  let currentState = 'active';
  let stateTimer = null;
  let observer = null;
  
  // Initialize
  function init() {
    // Check if already initialized
    if (window.lightxInitialized) return;
    window.lightxInitialized = true;
    
    // Listen for state changes from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'setState') {
        setVisualState(message.state);
        sendResponse({ success: true });
      } else if (message.action === 'getState') {
        sendResponse({ state: currentState });
      } else if (message.action === 'ping') {
        sendResponse({ active: true, state: currentState });
      }
      return true;
    });
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up form input detection
    setupFormProtection();
    
    // Set up media detection
    setupMediaProtection();
    
    // Add indicator element
    addIndicator();
    
    // Notify background script that content script is ready
    chrome.runtime.sendMessage({ action: 'contentScriptReady', url: window.location.href });
  }
  
  // Set visual state (CSS-only, never freezes JS)
  function setVisualState(state) {
    // Remove all state classes
    document.documentElement.classList.remove('lightx-active', 'lightx-eco', 'lightx-rest', 'lightx-deep');
    
    // Add new state class
    currentState = state || 'active';
    document.documentElement.classList.add(`lightx-${currentState}`);
    
    // Update indicator
    updateIndicator(state);
    
    // Log for debugging (only in development)
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.log(`[LightX] State changed to: ${currentState}`);
    }
  }
  
  // Update visual indicator
  function updateIndicator(state) {
    const indicator = document.getElementById('lightx-indicator');
    if (indicator) {
      indicator.setAttribute('data-state', state);
    }
  }
  
  // Add indicator element to page
  function addIndicator() {
    if (document.getElementById('lightx-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'lightx-indicator';
    indicator.setAttribute('data-state', 'active');
    indicator.style.cssText = `
      position: fixed !important;
      bottom: 10px !important;
      right: 10px !important;
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    `;
    
    // Append to document
    if (document.body) {
      document.body.appendChild(indicator);
    } else {
      // Wait for body
      const observer = new MutationObserver(() => {
        if (document.body) {
          document.body.appendChild(indicator);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true });
    }
  }
  
  // Handle page visibility changes
  function handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden - can apply stronger optimization after delay
      scheduleStateChange('eco', 60000); // 1 minute
    } else {
      // Page is visible - restore immediately
      clearScheduledStateChange();
      setVisualState('active');
    }
  }
  
  // Schedule a state change
  function scheduleStateChange(state, delay) {
    clearScheduledStateChange();
    stateTimer = setTimeout(() => {
      // Only change if still hidden and not protected
      if (document.hidden && !isProtected()) {
        setVisualState(state);
        // Schedule next level
        if (state === 'eco') {
          scheduleStateChange('rest', 120000); // 2 more minutes
        } else if (state === 'rest') {
          scheduleStateChange('deep', 300000); // 5 more minutes
        }
      }
    }, delay);
  }
  
  // Clear scheduled state change
  function clearScheduledStateChange() {
    if (stateTimer) {
      clearTimeout(stateTimer);
      stateTimer = null;
    }
  }
  
  // Check if page is protected (form input, media playing, etc.)
  function isProtected() {
    // Check for active form inputs
    const activeElement = document.activeElement;
    if (activeElement) {
      const tagName = activeElement.tagName.toLowerCase();
      const isInput = ['input', 'textarea', 'select'].includes(tagName);
      const isContentEditable = activeElement.isContentEditable;
      if (isInput || isContentEditable) {
        return true;
      }
    }
    
    // Check for playing media
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      if (!video.paused && !video.ended) {
        return true;
      }
    }
    
    const audios = document.querySelectorAll('audio');
    for (const audio of audios) {
      if (!audio.paused && !audio.ended) {
        return true;
      }
    }
    
    return false;
  }
  
  // Set up form input protection
  function setupFormProtection() {
    const handleInputFocus = () => {
      // When user focuses an input, ensure we're in active state
      if (currentState !== 'active') {
        setVisualState('active');
      }
      clearScheduledStateChange();
    };
    
    document.addEventListener('focusin', handleInputFocus);
    
    // Also check periodically for focused elements
    setInterval(() => {
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        if (['input', 'textarea', 'select'].includes(tagName) || activeElement.isContentEditable) {
          handleInputFocus();
        }
      }
    }, 5000);
  }
  
  // Set up media protection
  function setupMediaProtection() {
    const handleMediaPlay = () => {
      // When media starts playing, ensure we're in active state
      if (currentState !== 'active') {
        setVisualState('active');
      }
      clearScheduledStateChange();
    };
    
    // Monitor for video/audio elements
    const mediaObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
            node.addEventListener('play', handleMediaPlay);
          }
          // Check children too
          if (node.querySelectorAll) {
            node.querySelectorAll('video, audio').forEach(media => {
              media.addEventListener('play', handleMediaPlay);
            });
          }
        });
      });
    });
    
    mediaObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // Also add listeners to existing media
    document.querySelectorAll('video, audio').forEach(media => {
      media.addEventListener('play', handleMediaPlay);
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also try immediate init for early setup
  setTimeout(init, 0);
  
})();