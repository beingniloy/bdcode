<div align="center">

# বাংলাদেশ কোড (Bangladesh Code)

### **WHAT IF VS Code Was Built by the Bangladesh Government?**

A fully-featured, bilingual code editor designed for the developers of Bangladesh - built with the power of VS Code and the identity of a nation.

![bdcode](https://socialify.git.ci/beingniloy/bdcode/image?custom_language=VSCode&forks=1&issues=1&language=1&name=1&owner=1&pattern=Solid&pulls=1&stargazers=1&theme=Auto)

</div>

---

## Screenshots

<p align="center">
  <a href="#">
    <img src="#" alt="Bangladesh Code Editor Screenshot" width="600" style="border-radius: 8px; border: 1px solid #333;" />
  </a>
</p>


---

## What is Bangladesh Code?

Bangladesh Code is an **official-grade code editor** built for the Government of Bangladesh. It combines the familiar power and interface of Visual Studio Code with a **fully Bengali-localized experience**, government branding, and built-in tools tailored for public sector software development.

Think of it as **VS Code, but ours** — বাংলায়, বাংলার জন্য।

---

## Key Features

### Editor & IDE

- **Monaco Editor** — The same editor engine that powers VS Code
- **Syntax Highlighting** — HTML, CSS, JavaScript, PHP, JSON, Markdown, and more
- **Multi-tab Editing** — Open, switch, and manage multiple files simultaneously
- **Undo/Redo** — Full content-level undo/redo history per file
- **Auto Save** — Optional real-time saving to disk
- **Minimap** — Toggleable code minimap navigation
- **Find & Replace** — Global search across all files with case sensitivity, whole word, and regex support

### File Explorer

- **Full File Tree** — Browse your project folders just like VS Code
- **Create / Rename / Delete** — Files and folders with confirmation dialogs
- **Copy / Cut / Paste** — Clipboard operations across the file tree
- **Folder Context Actions** — New file/folder inside any subfolder
- **Right-click Context Menu** — All standard operations at your fingertips
- **Dynamic Project Name** — Sidebar shows the actual opened folder name

### Terminal

- **Integrated Terminal** — xterm.js powered terminal built into the editor
- **Shell Support** — PowerShell (Windows), zsh (macOS), bash (Linux)
- **PTY Backend** — Real pseudo-terminal via `node-pty` for full compatibility
- **Sandbox Mode** — Optional restricted terminal execution for security

### Bilingual UI (বাংলা / English)

- **Complete Bengali Translation** — Every menu, button, dialog, and tooltip
- **Instant Language Toggle** — Switch between বাংলা and English on the fly
- **Bengali Input Support** — Type and code in Bangla natively
- **Unicode First** — UTF-8 throughout, `Noto Sans Bengali` font family

### Theming & Appearance

- **Light & Dark Themes** — Government-branded color schemes
- **CSS Variable System** — Full theme customization via CSS custom properties
- **Custom Icon Themes** — VS Code Flat and Government Default icon sets
- **Adjustable Font Size** — Increase/decrease from sidebar or settings
- **Sidebar Position** — Left or right, your choice

### Government & Security

- **Gov-Branded UI** — Official Bangladesh Government green color palette (`#006A4E`)
- **Offline Mode** — Block all network requests for classified work
- **Telemetry Blocker** — Built-in script blocker for analytics/telemetry
- **SSL Verification** — Configurable SSL certificate checking
- **Sandbox Execution** — Run code in restricted mode when enabled

### Auto-Update System

- **In-App Update Notifications** — Bell icon in status bar with amber dot
- **One-Click Download & Install** — Download updates without leaving the editor
- **Manual Update Option** — Check for updates from Settings > About

### Git Integration

- **Git Status Panel** — View branch, changes, and file statuses
- **Init / Commit / Push / Pull** — All basic Git operations from the sidebar
- **Terminal Integration** — Full Git CLI available in the integrated terminal

### Extensions (Planned)

- **Extension Marketplace** — Browse and install Bengali-focused extensions
- **Bangla Spellchecker** — Spellcheck for Bengali comments and strings
- **PHP Runner** — Run PHP directly from the editor
- **C/C++ Pack** — Compile and debug C/C++ code

### Developer Tools

- **Command Palette** — `Ctrl+Shift+P` for quick access to all commands
- **Keyboard Shortcuts** — Fully customizable keybindings
- **Problems Panel** — Static analysis for code quality warnings
- **Live HTML Preview** — See your HTML output in real-time
- **Documentation Panel** — Built-in coding guidelines and security directives
- **Go to Line** — Navigate to any line number instantly
- **Code Folding & Bracket Matching** — Advanced editor features built-in

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20 recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

```bash
# Clone the repository
git clone https://github.com/beingniloy/bdcode.git
cd bdcode

# Install dependencies
npm install
```

### Development

```bash
# Web-only mode (browser at localhost:5173)
npm run dev

# Desktop mode (Electron + Vite hot reload)
npm run desktop
```

### Build

```bash
# Build for production (web)
npm run build

# Build Windows installer (.exe)
npm run build:win

# Build macOS installer (.dmg)
npm run build:mac

# Build Linux package (.AppImage)
npm run build:linux

# Type check
npm run lint
```

---

## Tech Stack

| Layer           | Technology          | Purpose                      |
| --------------- | ------------------- | ---------------------------- |
| **Frontend**    | React 18            | UI framework                 |
| **Language**    | TypeScript          | Type safety                  |
| **Bundler**     | Vite 5              | Fast dev & build             |
| **Desktop**     | Electron 34         | Cross-platform desktop app   |
| **Editor**      | Monaco Editor       | VS Code's editor engine      |
| **Terminal**    | xterm.js + node-pty | Real terminal emulation      |
| **Icons**       | Lucide React        | 1000+ consistent icons       |
| **Styling**     | CSS Variables       | Custom government theme      |
| **Auto-Update** | electron-updater    | In-app update system         |
| **Packaging**   | electron-builder    | Platform-specific installers |
| **CI/CD**       | GitHub Actions      | Automated builds & releases  |

---

## Project Structure

```
bdcode/
├── .github/
│   └── workflows/
│       └── release.yml          # CI/CD — build on tag push
├── public/
│   └── images/
│       ├── gov-logo.svg         # Government logo
│       ├── digital-bd-logo.svg  # Digital Bangladesh logo
│       ├── logo.png             # App logo
│       └── qr-code.svg          # QR code asset
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component (layout, shortcuts)
│   ├── index.css                # Global styles & CSS variables
│   ├── types.ts                 # TypeScript type definitions
│   ├── translations.ts          # Bengali & English translations
│   ├── settingsDef.ts           # Settings schema definitions
│   ├── utils.ts                 # Tree utilities & helpers
│   ├── demoData.ts              # Demo files for web mode
│   ├── commands.ts              # Command definitions
│   ├── components/
│   │   ├── TitleBar.tsx         # Custom window title bar
│   │   ├── Toolbar.tsx          # Top toolbar with actions
│   │   ├── ActivityBar.tsx      # VS Code-style activity bar
│   │   ├── ExplorerSidebar.tsx  # File tree with context menu
│   │   ├── SidebarPanels.tsx    # Search, Git, Extensions, Docs, Settings
│   │   ├── EditorArea.tsx       # Monaco editor with tabs
│   │   ├── BottomPanel.tsx      # Terminal & problems panel
│   │   ├── RightSidebar.tsx     # Preview & documentation
│   │   ├── StatusBar.tsx        # Status bar with update indicator
│   │   ├── Footer.tsx           # Footer component
│   │   ├── ContextMenu.tsx      # Reusable context menu
│   │   ├── ConfirmDialog.tsx    # Custom alert/confirm/prompt dialogs
│   │   ├── ErrorBoundary.tsx    # Error boundary wrapper
│   │   ├── XTerminal.tsx        # Terminal component
│   │   └── modals/
│   │       ├── SettingsModal.tsx    # Settings with About section
│   │       ├── CommandPalette.tsx   # Ctrl+Shift+P palette
│   │       ├── KeybindingsModal.tsx # Keybinding editor
│   │       ├── PublishModal.tsx     # Deploy/publish dialog
│   │       └── BugReportModal.tsx   # Bug report form
│   ├── contexts/
│   │   ├── FileSystemContext.tsx    # Files, tabs, clipboard, undo/redo
│   │   ├── LayoutContext.tsx        # Sidebar, panel sizes & state
│   │   ├── ModalContext.tsx         # Modal open/close state
│   │   └── SettingsContext.tsx      # User settings & theme
│   └── hooks/
│       ├── useContextMenu.ts    # Context menu state management
│       ├── useDialog.ts         # Custom dialog system (alert/confirm/prompt)
│       ├── useKeybindingHandler.ts  # Keyboard shortcut handler
│       └── useTranslation.ts    # i18n hook
├── electron.cjs                 # Electron main process
├── preload.cjs                  # IPC bridge (contextBridge)
├── run-dev.js                   # Dev script (Vite + Electron)
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies & build config
└── LICENSE                      # MIT License
```

---

## Scripts Reference

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start Vite dev server (web mode)         |
| `npm run desktop`     | Start Electron with Vite hot reload      |
| `npm run build`       | TypeScript check + Vite production build |
| `npm run lint`        | TypeScript type checking only            |
| `npm run preview`     | Preview production build locally         |
| `npm run build:win`   | Build Windows NSIS installer             |
| `npm run build:mac`   | Build macOS DMG                          |
| `npm run build:linux` | Build Linux AppImage                     |

---

## Keyboard Shortcuts

| Shortcut        | Action                            |
| --------------- | --------------------------------- |
| `Ctrl+S`        | Save current file                 |
| `Ctrl+Shift+S`  | Save all files                    |
| `Ctrl+Z`        | Undo                              |
| `Ctrl+Shift+Z`  | Redo                              |
| `Ctrl+N`        | New file                          |
| `Ctrl+B`        | Toggle sidebar                    |
| `Ctrl+`` `      | Toggle terminal                   |
| `Ctrl+Shift+P`  | Command palette                   |
| `Ctrl+Shift+F`  | Global search                     |
| `Ctrl+,`        | Open settings                     |
| `Ctrl+K Ctrl+S` | Open keyboard shortcuts           |
| `F2`            | Rename (in explorer context menu) |
| `Delete`        | Delete (in explorer context menu) |

---

### Download

Pre-built installers are available on the [Releases](https://github.com/beingniloy/bdcode/releases) page.

| Platform | File        | Installer                               |
| -------- | ----------- | --------------------------------------- |
| Windows  | `.exe`      | NSIS installer with Start Menu shortcut |
| macOS    | `.dmg`      | Drag-to-Applications disk image         |
| Linux    | `.AppImage` | Portable executable                     |

---

## Government Branding

Bangladesh Code uses the official **Government of Bangladesh** green palette:

| Token               | Hex       | Usage                                   |
| ------------------- | --------- | --------------------------------------- |
| `--gov-green`       | `#006A4E` | Primary actions, buttons, active states |
| `--gov-green-dark`  | `#005A42` | Hover states, dark accents              |
| `--gov-green-light` | `#00875A` | Links, highlights                       |
| `--gov-red`         | `#DC2626` | Danger actions, errors                  |

---

## Contributing

Contributions are welcome! Please read our guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/beingniloy/bdcode.git
cd bdcode
npm install
npm run desktop
```

---

## Security

For security vulnerabilities, please contact the maintainers directly. Do **not** open public issues for security-related bugs.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License — Copyright (c) 2026 Bangladesh Code
```

---

## Acknowledgments

- [Visual Studio Code](https://code.visualstudio.com/) — Inspiration and Monaco Editor
- [Electron](https://www.electronjs.org/) — Cross-platform desktop framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — The editor engine
- [xterm.js](https://xtermjs.org/) — Terminal emulation
- [Lucide](https://lucide.dev/) — Icon library
- [React](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — Build tool

---

<div align="center">

**Made with ❤️ for Bangladeshi Coder**

_What if VS Code was built by the Bangladesh Government?_
_Now you know._

</div>
