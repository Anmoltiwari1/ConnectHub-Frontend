<div align="center">
  <h1>💻 ConnectHub Frontend</h1>
  <p><em>The elegant, real-time client application for ConnectHub, built with React 19, Vite, and WebSockets (STOMP).</em></p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/React_19-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_8-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="WebSockets" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</div>

<br />

## 📖 Table of Contents
- [✨ Key Features](#-key-features)
- [💻 Tech Stack](#-tech-stack)
- [📂 Project Architecture](#-project-architecture)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🚀 Setup & Commands](#-setup--commands)
- [🔌 WebSocket Integration](#-websocket-integration)

---

## ✨ Key Features

The ConnectHub frontend delivers a premium, highly responsive user interface designed for real-time collaboration:

*   **⚡ Instant STOMP WebSockets**: Seamless real-time message broadcasting and reaction rendering using SockJS and STOMP protocols.
*   **👥 Interactive Dashboard**: Features side-by-side navigations for channel listings, group rooms, private direct messages (DMs), and online statuses.
*   **🟢 Live Presence Indicator**: Displays dynamic status markers (ONLINE, AWAY, DND, OFFLINE) on user avatars, updating instantly as presence changes.
*   **📁 Optimized Media Uploads**: Supports sending attachments and images directly inside the chat feed, showing responsive generated thumbnails.
*   **🔐 OAuth2 & JWT Security**: Integrates secure local credential authentication and Google OAuth2 login handlers with persistent JWT token storage.
*   **🎨 Premium Glassmorphic Design**: Clean UI styling complete with smooth hover transitions, beautiful dark-mode accents, and clean micro-interactions.

---

## 💻 Tech Stack

### Core Technologies
- **UI Library**: React 19 (Hooks, Context API, stateful optimizations)
- **Bundler & Server**: Vite (Instant Hot Module Replacement & production assets optimization)
- **Routing**: React Router DOM 7 (Dynamic client-side route mapping)
- **Websocket Clients**: `@stomp/stompjs` & `sockjs-client` (Enterprise-grade real-time messaging)

### Development & Testing
- **Linter**: ESLint (Code cleanliness rules)
- **Unit Testing**: Vitest & React Testing Library (Comprehensive component assertions)

---

## 📂 Project Architecture

The ConnectHub client source code is highly modular, using a clean, modern folder structure that separates visual pages, reusable UI components, and global state managers.

### 🌳 Directory Structure

```text
📁 connecthub-frontend
├── 📁 public/                     # Static public assets (logos, icons)
└── 📁 src/                        # Main application source
    ├── 📁 components/             # Reusable atomic UI components (cards, sidebars)
    ├── 📁 config/                 # Centralized connection & API endpoints mapping
    ├── 📁 context/                # Global React Context state providers
    │   ├── 📄 AuthContext.jsx         # Persistent user sessions, login state & JWTs
    │   └── 📄 WebSocketContext.jsx    # SockJS / STOMP WebSockets socket routing
    ├── 📁 pages/                  # Main layout views & router screens
    │   ├── 📄 LoginPage.jsx           # Secure user credentials entry form
    │   ├── 📄 RegisterPage.jsx        # New account registration form
    │   ├── 📄 DashboardPage.jsx       # Interactive chat window, DM listings & channels
    │   ├── 📄 ProfilePage.jsx         # Profile bio, avatar, and active status editor
    │   └── 📄 OAuth2RedirectHandler.jsx # SSO third-party Google OAuth callback handler
    ├── 📄 App.jsx                 # Client-side router mappings & global layout
    ├── 📄 index.css               # Global CSS styles & glassmorphic custom theme
    └── 📄 main.jsx                # React virtual DOM root mount entry
```

### 🗺️ Modules Map

| Directory | Key Files | Core Purpose |
| :--- | :--- | :--- |
| **`📁 components/`** | Reusable UI widgets | Houses highly modular and presentation-only UI components (like Sidebars, Message Inputs, and Buttons). |
| **`📁 context/`** | [AuthContext.jsx](file:///d:/ConnectHub%20New%20Features/Connecthub%20final/connecthub-parent/connecthub-frontend/src/context/AuthContext.jsx), [WebSocketContext.jsx](file:///d:/ConnectHub%20New%20Features/Connecthub%20final/connecthub-parent/connecthub-frontend/src/context/WebSocketContext.jsx) | Handles global app state and side-effects (STOMP WebSocket handshakes, JWT persistence, local storage). |
| **`📁 pages/`** | [DashboardPage.jsx](file:///d:/ConnectHub%20New%20Features/Connecthub%20final/connecthub-parent/connecthub-frontend/src/pages/DashboardPage.jsx), [ProfilePage.jsx](file:///d:/ConnectHub%20New%20Features/Connecthub%20final/connecthub-parent/connecthub-frontend/src/pages/ProfilePage.jsx) | Full-screen visual page layouts mapped directly to client-side React Router DOM pathways. |
| **`📁 config/`** | API & Connection mappings | Isolates URL endpoints and protocol configs to keep deployment environment variables decoupled. |

---

## ⚙️ Environment Configuration

The frontend dynamically communicates with the backend REST APIs and the WebSocket Handler gateway. You can easily specify connection endpoints inside a `.env` file at the frontend root:

```env
# REST API endpoint mapping (Default auth-service gateway)
VITE_API_BASE_URL=http://localhost:8080

# WebSocket STOMP endpoint gateway (Default websocket-handler)
VITE_WS_ENDPOINT=ws://localhost:8087/ws
```

---

## 🚀 Setup & Commands

Ensure you have [Node.js (v18+)](https://nodejs.org/) installed before proceeding.

### 📥 1. Install Dependencies
Run the install command inside the frontend directory:
```bash
npm install
```

### 🏃‍♂️ 2. Run in Development
Start the instant-reloading dev server:
```bash
npm run dev
```
> The frontend application will be active at: [http://localhost:5173](http://localhost:5173)

### 📦 3. Create Production Build
Bundle and optimize all CSS/JS assets for distribution:
```bash
npm run build
```

### 🧪 4. Execute Unit Tests
Run the component test suites using Vitest:
```bash
npm run test
```

---

## 🔌 WebSocket Integration

The real-time layer is managed seamlessly using React Context. Below is the subscription scheme used to process real-time communication across the platform:

| Destination Subscribed | Purpose | Action Payload |
| :--- | :--- | :--- |
| `/topic/room.{roomId}` | Channel / DM message events | Append incoming message objects directly to active conversation feeds |
| `/topic/presence` | User presence updates | Toggle dynamic status dots on friends' cards instantly |
| `/app/chat.send` | Publishing new messages | Triggers WS Handler publishing event payload directly to RabbitMQ |
| `/app/chat.pin` | Pinning/Unpinning messages | Broadcasts pin state updates instantly to all room participants |

---
<div align="center">
  <p>Crafted with ❤️ for high-performance frontend interfaces.</p>
</div>
