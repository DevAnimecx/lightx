<!--
  LightX – Smart Tab & Memory Optimizer
  Keywords: chrome extension, firefox extension, tab manager, memory optimizer, browser performance, productivity, Animecx, Blackvault, LightX
-->

<div align="center">

<h1>𝙻𝙸𝙶𝙷𝚃𝚇</h1>
<h3>𝚂𝙼𝙰𝚁𝚃 𝚃𝙰𝙱 & 𝙼𝙴𝙼𝙾𝚁𝚈 𝙾𝙿𝚃𝙸𝙼𝙸𝚉𝙴𝚁</h3>

<p>
  Clean • Fast • Cross‑browser • Built for people who live with 50+ tabs open
</p>

<p>
  <sub>Chrome · Edge · Firefox · Opera · (Safari via wrapper)</sub>
</p>

<br/>

<!-- Trust / social proof style badges (update with real links when available) -->
<p>
  <b>Designed by</b> Blackvault Inc. · <b>Built by</b> Animecx  
  <br/>
  <sub>Security‑first, developer‑grade browser automation.</sub>
</p>

</div>

---

## 🧬 𝐕𝐈𝐒𝐈𝐎𝐍 · 𝐖𝐇𝐘 𝐋𝐈𝐆𝐇𝐓𝐗?

> 𝖫𝗂𝗀𝗁𝗍𝖷 is a **smart, invisible performance layer** for your browser.

Most tab managers either freeze everything aggressively or look like raw DevTools.  
**LightX** focuses on three pillars:

- **Performance** – keep dozens of tabs open without turning your machine into a jet engine.
- **Respect** – never silently kill your media, forms, and important sessions.
- **Experience** – premium, OS‑grade UI that looks like a built‑in feature, not a hack.

If your default reflex is “I’m not closing these 60 tabs”, LightX is built for you.

---

## 🛡 𝐓𝐑𝐔𝐒𝐓 & 𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘 𝐏𝐇𝐈𝐋𝐎𝐒𝐎𝐏𝐇𝐘

> ⚠️ No fake claims. Everything below reflects how LightX is engineered today.

- **Open codebase** – All core logic lives in this repo; inspect it, fork it, audit it.
- **No remote code execution** – LightX does not pull arbitrary remote scripts to run in your browser.
- **Scoped permissions only** – Uses `tabs`, `storage`, `alarms`, `scripting`, and required host permissions for tab control and configuration.
- **No analytics beacons** – No external trackers or third‑party analytics SDKs baked into the extension code.
- **Local‑first state** – Settings and presets are stored via browser storage APIs, not pushed to external servers by default.

> As public audits (e.g. VirusTotal reports or third‑party scanners like Bluetick AI) are added, you can link them here with real “verified” labels and badges.

---

## 🏆 𝐅𝐄𝐀𝐓𝐔𝐑𝐄 𝐌𝐀𝐓𝐑𝐈𝐗

| Area          | What LightX Delivers                                                                |
|--------------|---------------------------------------------------------------------------------------|
| Tab lifecycle| 4‑stage intelligent states: Active → Eco → Rest → Deep                              |
| UX / Design  | iOS‑inspired surfaces, dark‑mode first, SVG icon system, subtle motion               |
| Performance  | CSS‑driven effects, minimal JS overhead, native Canvas analytics                     |
| Safety       | Media detection, form protection, protected domain logic                             |
| Portability  | Shared JS/CSS/HTML core, V2 + V3 manifests, multi‑store‑ready bundles                |
| Control      | Domain rules, presets, timing sliders, import/export of configuration                |

---

## 🔥 𝐊𝐄𝐘 𝐂𝐀𝐏𝐀𝐁𝐈𝐋𝐈𝐓𝐈𝐄𝐒

### 🧠 𝗜𝗻𝘃𝗶𝘀𝗶𝗯𝗹𝗲 𝗧𝗮𝗯 𝗘𝗻𝗴𝗶𝗻𝗲

- 4 intelligent **energy states** per tab *(Active / Eco / Rest / Deep)*.
- Smooth opacity + blur transitions with **zero jank** on tab switch.
- Feels like a **native browser feature** instead of a bolt‑on script.

### 🛡️ 𝗦𝗺𝗮𝗿𝘁 𝗣𝗿𝗼𝘁𝗲𝗰𝘁𝗶𝗼𝗻 𝗟𝗮𝘆𝗲𝗿

- Detects **video/audio playback** and keeps those tabs alive.
- Protects **forms, editors, and critical flows** from accidental unloads.
- Built‑in **safe list** for streaming, banking, collaboration suites, plus custom rules.

### 📊 𝗣𝗲𝗿𝗳𝗼𝗿𝗺𝗮𝗻𝗰𝗲 𝗜𝗻𝘀𝗶𝗴𝗵𝘁𝘀

- Real‑time memory and tab stats.
- Tab grid with heavy/idle tab visibility.
- No heavyweight chart libraries – **native Canvas only**.

### 🎚️ 𝗣𝗼𝘄𝗲𝗿 𝗨𝘀𝗲𝗿 𝗖𝗼𝗻𝘁𝗿𝗼𝗹

- Per‑domain behaviors: “Always active”, “Always protected”, custom timeouts.
- Presets: Focus / Balanced / Aggressive.
- Import/export config for sharing setups across machines or teams.

---

## 🌐 𝐂𝐑𝐎𝐒𝐒‑𝐁𝐑𝐎𝐖𝐒𝐄𝐑 𝐄𝐍𝐆𝐈𝐍𝐄

LightX is structured as a **multi‑store product** with a single shared core.

```text
dist/
├── chrome-edge/           # Manifest V3 for Chromium-based browsers
│   └── manifest.json
├── firefox-opera/         # Manifest V2 for Firefox & Opera
│   └── manifest.json
└── shared/                # Universal logic & UI
    ├── js/
    ├── css/
    ├── html/
    └── icons/
