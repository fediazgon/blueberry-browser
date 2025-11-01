# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blueberry Browser is an Electron-based web browser built with React and TypeScript. It's a Strawberry competitor that integrates LLM capabilities directly into the browser via a sidebar chat interface. The browser supports multiple tabs and provides web browsing with AI assistance.

## Development Commands

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Runs the Electron app in development mode with hot reload via electron-vite.

### Build & Type Checking

```bash
pnpm typecheck        # Type check all code
pnpm typecheck:node   # Type check main process only
pnpm typecheck:web    # Type check renderer processes only
pnpm build           # Type check + build for production
```

### Code Quality

```bash
pnpm lint    # Run ESLint
pnpm format  # Format code with Prettier
```

### Platform-Specific Builds

```bash
pnpm build:mac    # Build for macOS
pnpm build:win    # Build for Windows
pnpm build:linux  # Build for Linux
```

## Environment Configuration

Create a `.env` file in the project root with:

```
# Required: Choose one provider
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_anthropic_key

# Optional: Configure provider and model
LLM_PROVIDER=openai  # or "anthropic"
LLM_MODEL=gpt-4o-mini  # or "claude-3-5-sonnet-20241022"
```

**Default Models:**

- OpenAI: `gpt-4o-mini`
- Anthropic: `claude-3-5-sonnet-20241022`

## Architecture

### Process Model

Blueberry uses Electron's multi-process architecture with three distinct process types:

1. **Main Process** (`src/main/`): Node.js process managing the application lifecycle, native APIs, and browser windows
2. **Renderer Processes** (`src/renderer/`): Separate Chromium processes for UI components (TopBar, Sidebar)
3. **Preload Scripts** (`src/preload/`): Bridge layer between main and renderer with IPC APIs

### Main Process Architecture

The main process is class-based and organized around these core components:

- **`Window`**: Root container managing the BaseWindow, all tabs, and UI components (TopBar, Sidebar). Orchestrates layout and bounds calculations.
- **`Tab`**: Wraps a WebContentsView for each browser tab. Handles web navigation, JavaScript execution, screenshots, and page content extraction.
- **`TopBar`**: Manages the address bar and tab UI (React app in WebContentsView)
- **`SideBar`**: Manages the AI chat interface (React app in WebContentsView) and owns the LLMClient
- **`EventManager`**: Central IPC handler registering all `ipcMain.handle` events for tab management, navigation, sidebar, and page content
- **`LLMClient`**: Manages AI chat conversations with streaming responses. Automatically captures screenshots and page context for each message.
- **`AppMenu`**: Native application menu (macOS/Windows/Linux)

**Key Pattern:** The `Window` class is instantiated first and holds references to TopBar and SideBar. The SideBar owns the LLMClient, which receives a Window reference after construction (via `setWindow()`) to avoid circular dependencies.

### Layout System

The browser uses Electron's WebContentsView with manual bounds management:

- **TopBar**: Fixed at top, 88px height (40px tabs + 48px address bar), full width
- **Sidebar**: Right-aligned, 400px width, toggleable visibility
- **Tabs**: Fill remaining space (below TopBar, left of Sidebar when visible)

When the window resizes or sidebar toggles, `Window.updateAllBounds()` recalculates all component positions.

### IPC Communication

**Preload Bridge Pattern:**

- `topbar.ts` → `topBarAPI`: Tab management, navigation, sidebar toggle
- `sidebar.ts` → `sidebarAPI`: Chat messages, page content access

**Event Flow:**

1. Renderer calls `window.topBarAPI.createTab()` or `window.sidebarAPI.sendChatMessage()`
2. Preload forwards via `ipcRenderer.invoke()`
3. EventManager in main process handles via `ipcMain.handle()`
4. Main process responds or emits events back via `webContents.send()`

### Tab Management

Each Tab is a sandboxed WebContentsView with:

- Security: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`
- Navigation tracking: Updates internal state on `did-navigate` events
- Content access: `getTabHtml()`, `getTabText()`, `runJs()`, `screenshot()`
- Visibility: Only active tab is visible; others are hidden but retained in memory

### LLM Integration

The `LLMClient` class:

- Supports both OpenAI and Anthropic via Vercel AI SDK
- Maintains conversation history (`CoreMessage[]`)
- Streams responses token-by-token to sidebar renderer
- Automatically attaches:
  - Screenshot of active tab (as base64 data URL)
  - Page URL and text content (truncated to 4000 chars)
- System prompt includes page context for contextual responses

**Message Flow:**

1. User sends message in sidebar React app
2. `sidebar-chat-message` IPC event triggered
3. LLMClient captures screenshot and page content
4. LLM streams response via `chat-response` events
5. Sidebar renders markdown with `react-markdown`

### Renderer Architecture

Two separate React applications:

**TopBar** (`src/renderer/topbar/`):

- `BrowserContext`: React context managing tab state via IPC
- `TabBar`: Displays tabs with close buttons
- `AddressBar`: URL input with back/forward/reload controls
- Polls tab state every 2 seconds to stay synchronized

**Sidebar** (`src/renderer/sidebar/`):

- `ChatContext`: Manages conversation state
- `Chat`: Message list with streaming support
- Listens for `chat-response` and `chat-messages-updated` events

Both use TailwindCSS for styling and share common components in `src/renderer/common/`.

### Dark Mode

Dark mode state is synchronized across all renderer processes:

- One renderer sends `dark-mode-changed` via IPC
- EventManager broadcasts `dark-mode-updated` to all renderers (TopBar, Sidebar, all Tabs)
- Each renderer updates via `useDarkMode` hook

## Common Development Tasks

### Adding a New IPC Event

1. Add handler in `EventManager.ts`:

   ```typescript
   ipcMain.handle("my-event", async (_, arg) => {
     // Implementation
   });
   ```

2. Expose in preload (`sidebar.ts` or `topbar.ts`):

   ```typescript
   myAction: (arg) => electronAPI.ipcRenderer.invoke("my-event", arg);
   ```

3. Call from renderer:
   ```typescript
   const result = await window.sidebarAPI.myAction(arg);
   ```

### Adding Tab Capabilities

Extend the `Tab` class with new methods, then expose via EventManager IPC handlers and preload APIs.

### Modifying LLM Behavior

Edit `LLMClient.ts`:

- `buildSystemPrompt()`: Change system instructions
- `MAX_CONTEXT_LENGTH`: Adjust page context size
- `DEFAULT_TEMPERATURE`: Tune response creativity
- `prepareMessagesWithContext()`: Modify context gathering

### Working with Screenshots

Screenshots are captured as NativeImage and converted to base64 data URLs:

```typescript
const image = await tab.screenshot();
const dataUrl = image.toDataURL();
```

The LLMClient automatically includes screenshots in multimodal messages for vision-capable models.

## Project Structure

```
src/
├── main/           # Main process (Node.js)
│   ├── index.ts    # Entry point
│   ├── Window.ts   # Main window orchestrator
│   ├── Tab.ts      # Browser tab wrapper
│   ├── TopBar.ts   # Top UI component
│   ├── SideBar.ts  # Sidebar UI component
│   ├── EventManager.ts  # IPC event handlers
│   ├── LLMClient.ts     # AI integration
│   └── Menu.ts     # Native menu
├── preload/        # IPC bridge layer
│   ├── sidebar.ts  # Sidebar APIs
│   └── topbar.ts   # TopBar APIs
└── renderer/       # UI (React + TypeScript)
    ├── topbar/     # Address bar & tabs
    ├── sidebar/    # AI chat interface
    └── common/     # Shared components
```

## Build Configuration

- **electron-vite**: Builds main, preload, and renderer processes separately
- **TailwindCSS**: Configured with dark mode support
- **TypeScript**: Separate tsconfig for node and web targets
- **React 19**: Latest React with TypeScript support
