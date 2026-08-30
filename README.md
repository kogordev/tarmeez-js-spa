# Tarmeez

Tarmeez is a lightweight single-page social application built with vanilla JavaScript, HTML, and CSS. It presents a clean blog-style experience for browsing posts, viewing user profiles, logging in or registering, and interacting with content through a modular UI and client-side routing system.

The project is served by a minimal Express static server and loads most behavior from browser-side modules under `frontend/src`. It consumes the public Tarmeez API and keeps the app responsive without a framework dependency.

## Key Features

- Single Page Application (SPA) routing with clean browser history support via `history.pushState` and `popstate` listeners.
- Dark / light theme switching with automatic system preference detection and persistent user preference via `localStorage`.
- Responsive post image lightbox preview with close support via `Esc`, backdrop click, and browser back navigation.
- Modern header UI with quick access to the developer contact email (`kogordev@gmail.com`) and GitHub profile (`https://github.com/kogordev`).
- Automatic text direction handling for multilingual content using `dir="auto"`, `unicode-bidi: plaintext`, and RTL/LTR-aware styling.
- Modal-based create post flow, confirmation dialogs, comment creation, and user auth interactions.

## Tech Stack

- Vanilla JavaScript (ES Modules)
- HTML5
- CSS3 with custom properties and layout primitives
- REST API integration with `fetch`
- Express static server for local development

## Project Structure

```text
.
├── ARCHITECTURE.md              # Project architecture and API contract notes
├── package.json                 # Node project metadata and dependencies
├── server.js                    # Express server that serves the frontend bundle
├── frontend/
│   ├── index.html               # Bootstraps the SPA and loads CSS/JS entrypoints
│   └── src/
│       ├── css/
│       │   ├── global.css       # Theme variables, global layout, and shared styling
│       │   └── components.css   # Component-level layout and design system styles
│       └── js/
│           ├── app.js           # Application bootstrap and route rendering
│           ├── components/
│           │   ├── confirm-modal.js
│           │   ├── create-post-card.js
│           │   ├── create-post-modal.js
│           │   ├── header.js
│           │   ├── image-modal.js
│           │   ├── loading-state.js
│           │   ├── pagination.js
│           │   ├── post-card.js
│           │   └── post-list.js
│           ├── router/
│           │   ├── router.js
│           │   └── routes.js
│           ├── services/
│           │   ├── auth-service.js
│           │   ├── comments-service.js
│           │   ├── http-client.js
│           │   ├── posts-service.js
│           │   ├── tags-service.js
│           │   └── users-service.js
│           ├── store/
│           │   └── auth-store.js
│           ├── utils/
│           │   ├── api-normalizers.js
│           │   ├── escape-html.js
│           │   ├── images.js
│           │   └── theme.js
│           └── views/
│               ├── home-view.js
│               ├── login-view.js
│               ├── post-detail-view.js
│               ├── register-view.js
│               └── user-profile-view.js
```

## Architecture & Design Patterns

### Modular ES6 architecture

The app is split into feature-oriented modules that separate responsibilities:

- `app.js` boots the application and wires the router to the active view.
- `router/` handles route matching, navigation, and browser history lifecycle.
- `views/` renders page-specific content for home, login, register, detail, and profile screens.
- `components/` builds reusable UI blocks such as headers, cards, confirm dialogs, modals, and pagination.
- `services/` centralizes API communication and request logic.
- `store/` maintains authentication state and persistence.
- `utils/` contains normalization, escaping, image helpers, and theme management.

### Centralized event handling and router lifecycle hooks

Navigation is managed from a custom router that listens for:

- direct route changes via `window.location.pathname`
- user-triggered navigation through `data-link` anchors
- browser back/forward events using `popstate`

This keeps route rendering centralized and avoids scattering page transitions across the app.

### Dynamic state management via browser APIs

The app relies on browser-native storage and event patterns to keep state responsive:

- `localStorage` stores the user's chosen theme and auth state.
- `matchMedia` detects the OS color preference for dark mode.
- DOM events drive UI actions such as login/logout, modal open/close, and inline form behavior.
- Dynamic content is generated and cleaned up through render functions that return teardown logic.

### Theme Controller

The theme system is built around CSS custom properties in `global.css` and a `ThemeController` class in `utils/theme.js`. The controller:

- reads the saved theme from `localStorage`
- falls back to `prefers-color-scheme`
- applies a `data-theme` attribute to `document.documentElement`
- listens for system changes when no explicit preference exists

### Lightbox and modal interactions

The image modal is implemented as a reusable DOM overlay that supports:

- backdrop click dismissal
- `Escape` key closing
- automatic close on browser history navigation
- smooth fade-in/fade-out transitions

## Architecture & Diagrams

The frontend architecture and interaction flow are documented in [ARCHITECTURE.md](ARCHITECTURE.md). It includes Mermaid diagrams for the application structure, user journey, navigation lifecycle, and state/data flow.

## Getting Started / Local Setup

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run the application locally

From the project root:

```bash
node server.js
```

The server serves the frontend on port `5600` by default.

Open the app in a browser:

```text
http://localhost:5600
```

### Notes

- The app serves static assets from the `frontend` directory.
- Client-side routes fall back to `frontend/index.html`, enabling SPA navigation without a backend router.
- The application expects the Tarmeez API to be reachable from the browser environment.

## Development Notes

This project intentionally avoids a framework and instead uses a direct DOM-first approach. That makes it easy to follow for learning, debugging, and customizing, while still supporting modern UI behaviors such as theming, route handling, and modal overlays.

---

## 🤖 Built with AI Collaboration

This project was developed through a collaborative AI-driven workflow:

- **AI Architecture & Prompt Engineering:** Prompts, structural decision-making, code reviews, and solution designs were conceptualized and crafted using **Gemini (Flash)**.
- **Autonomous Execution & Coding:** Code generation, file patches, testing, and Git commits were autonomously executed via **Roo Code** running **GitHub Copilot** model.
- **Lead Developer & Supervisor:** Built and directed by [kogordev](https://github.com/kogordev).

## License

This project is distributed under the ISC license as defined in `package.json`.
