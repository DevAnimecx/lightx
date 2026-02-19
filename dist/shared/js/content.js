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
 * LightX Invisible Mode - Content Script
 * Visual Effects Only - Never Freezes JavaScript
 * Cross-browser compatible (Chrome/Firefox/Edge/Opera)
 */

(function() {
  'use strict';

  // Use BrowserAPI polyfill if available
  const API = typeof BrowserAPI !== 'undefined' ? BrowserAPI : 
              (typeof browser !== 'undefined' ? browser : chrome);

  // State management
  let currentState = 'active';
  let stateTimer = null;
  
  // Initialize
  function init() {
    if (window.lightxInitialized) return;
    window.lightxInitialized = true;
    
    // Listen for state changes from background script
    API.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    API.runtime.sendMessage({ 
      action: 'contentScriptReady', 
      url: window.location.href 
    });
  }
  
  // Set visual state (CSS-only, never freezes JS)
  function setVisualState(state) {
    document.documentElement.classList.remove('lightx-active', 'lightx-eco', 'lightx-rest', 'lightx-deep');
    
    currentState = state || 'active';
    document.documentElement.classList.add(`lightx-${currentState}`);
    
    updateIndicator(state);
    
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
    
    if (document.body) {
      document.body.appendChild(indicator);
    } else {
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
      scheduleStateChange('eco', 60000);
    } else {
      clearScheduledStateChange();
      setVisualState('active');
    }
  }
  
  // Schedule a state change
  function scheduleStateChange(state, delay) {
    clearScheduledStateChange();
    stateTimer = setTimeout(() => {
      if (document.hidden && !isProtected()) {
        setVisualState(state);
        if (state === 'eco') {
          scheduleStateChange('rest', 120000);
        } else if (state === 'rest') {
          scheduleStateChange('deep', 300000);
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
  
  // Check if page is protected
  function isProtected() {
    const activeElement = document.activeElement;
    if (activeElement) {
      const tagName = activeElement.tagName.toLowerCase();
      const isInput = ['input', 'textarea', 'select'].includes(tagName);
      const isContentEditable = activeElement.isContentEditable;
      if (isInput || isContentEditable) {
        return true;
      }
    }
    
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
      if (currentState !== 'active') {
        setVisualState('active');
      }
      clearScheduledStateChange();
    };
    
    document.addEventListener('focusin', handleInputFocus);
    
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
      if (currentState !== 'active') {
        setVisualState('active');
      }
      clearScheduledStateChange();
    };
    
    const mediaObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
            node.addEventListener('play', handleMediaPlay);
          }
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
  
  setTimeout(init, 0);
  
})();