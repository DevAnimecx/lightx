<!--
  LightX – Smart Tab & Memory Optimizer
  SEO keywords: chrome extension, firefox extension, tab manager, memory optimizer, productivity, browser performance, Blackvault, Animecx, LightX
-->

<p align="center">
  <img src="https://raw.githubusercontent.com/DevAnimecx/lightx/main/dist/icons/icon128.png" alt="LightX Logo" width="96" />
</p>

<h1 align="center">𝙻𝙸𝙶𝙷𝚃𝚇 – 𝗦𝗠𝗔𝗥𝗧 𝗧𝗔𝗕 & 𝗠𝗘𝗠𝗢𝗥𝗬 𝗢𝗣𝗧𝗜𝗠𝗜𝗭𝗘𝗥</h1>

<p align="center">
  Clean. Fast. Cross‑browser. Built for power users who live with 50+ tabs open.
</p>

<p align="center">
  <b>Chrome · Edge · Firefox · Opera · (Safari via wrapper)</b>
</p>

---

## ✨ 𝖶𝗁𝖺𝗍 𝗂𝗌 𝖫𝗂𝗀𝗁𝗍𝖷?

**LightX** is a multi‑store browser extension that automatically optimizes your tabs, reduces memory usage, and keeps your browsing smooth – without breaking media, forms, or your workflow.  
It ships with a premium iOS‑inspired UI, analytics dashboard, and a cross‑browser engine that runs on a single shared codebase.

> Think of it as a **smart, invisible performance layer** for your browser.

---

## 🚀 𝙺𝙴𝚈 𝙷𝙸𝙶𝙷𝙻𝙸𝙶𝙷𝚃𝚂

- **Invisible Tab Optimization** – 4 intelligent states *(Active → Eco → Rest → Deep)* with smooth opacity/blur transitions.
- **Smart Protection** – Respects media playback, form inputs, and protected domains (e.g. YouTube, Netflix, OTT, banking).
- **Cross‑Browser Ready** – Single shared JS/CSS/HTML powering Chrome, Edge, Firefox, Opera (Safari via wrapper).
- **Premium UI/UX** – Apple‑style design, SVG icons, dark‑mode first, micro‑animations, clean typography.
- **Analytics Dashboard** – Live memory stats, tab grid, performance metrics, native Canvas charts (no heavy deps).
- **Advanced Settings** – Domain rules, quick presets, timing sliders, import/export of config.
- **Production Build System** – One command `./build.sh` generates ready‑to‑submit ZIPs for all major stores.

---

## 📦 𝙵𝙴𝙰𝚃𝚄𝚁𝙴 𝚂𝙴𝚃

### 🧠 Invisible Tab Engine

- Auto‑transitions tabs through 4 *energy states* based on usage and activity.
- CSS‑driven effects (no aggressive JS freezing) for glitch‑free switching.
- Keeps active tabs crisp while gently dimming idle tabs.

### 🛡️ Smart Protection Layer

- Detects **video/audio playback** and prevents premature throttling.
- Protects **forms and input fields** from unwanted refresh or unload.
- Built‑in **safe list** for streaming, collaboration, and payment sites.
- User activity tracking to avoid interrupting active work.

### 📊 Performance & Analytics

- Real‑time memory usage indicators.
- Tab summaries and performance panels.
- Minimal, dependency‑free charts built on native Canvas.

### 🎛️ Settings & Control

- Per‑domain rules (always active, always protected, custom timeouts).
- Preset modes (Focus, Balanced, Aggressive).
- Fine‑tuned timing sliders.
- Export/Import configuration for power users & teams.

---

## 🌐 𝙲𝚁𝙾𝚂𝚂‑𝙱𝚁𝙾𝚆𝚂𝙴𝚁 𝙰𝚁𝙲𝙷𝙸𝚃𝙴𝙲𝚃𝚄𝚁𝙴

LightX ships with two manifests and one shared core:

| Target Browser | Manifest | Folder                       | Status        |
|----------------|----------|------------------------------|---------------|
| Chrome         | V3       | `dist/chrome-edge/`          | Local‑ready   |
| Edge           | V3       | `dist/chrome-edge/`          | Local‑ready   |
| Firefox        | V2       | `dist/firefox-opera/`        | Local‑ready   |
| Opera          | V2       | `dist/firefox-opera/`        | Local‑ready   |
| Safari         | V3       | `dist/shared/` (wrapper req) | Planned       |

### 🧩 Shared Polyfill Layer

```js
// dist/shared/js/polyfill.js (conceptual)
const isFirefox = typeof browser !== 'undefined' && browser.runtime;
const isChrome = typeof chrome !== 'undefined' && chrome.runtime && !isFirefox;

window.BrowserAPI = {
  tabs: { /* query, get, update, remove, sendMessage */ },
  storage: { local: { /* get, set, remove, clear */ } },
  runtime: { /* sendMessage, onMessage */ },
  alarms: { /* create, clear, onAlarm */ }
};
