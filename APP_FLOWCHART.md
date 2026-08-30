# Tarmeez Application Flowchart

Version: v2.0 - Root Absolute Imports & Autolink Ready

This document maps the browser-side runtime flow for the Tarmeez SPA, including deployment routing, router lifecycle, app bootstrapping, data sanitization, and user interaction handling.

```mermaid
graph TD
    %% Deployment / entry
    A[User visits URL in browser] --> B{Vercel request}
    B --> C[vercel.json rewrite]
    C --> D[/frontend/index.html]
    D --> E[/frontend/js/app.js]

    %% App bootstrap
    E --> F[document.body replaceChildren(header, main)]
    F --> G[createRouter render callback]
    G --> H[router.start()]
    H --> I[renderHeader + auth state + nav listeners]
    I --> J[Browser history + route matching]

    %% Router lifecycle
    J --> K{Current path matches route}
    K -->|/| L[renderHomeView]
    K -->|/post/:postId| M[renderPostDetailView]
    K -->|/profile/:id| N[renderUserProfileView]
    K -->|/login| O[renderLoginView]
    K -->|/register| P[renderRegisterView]
    K -->|default| Q[Page not found]

    %% Route-specific view composition
    L --> R[Home view + post list + create post card]
    M --> S[Post detail + comments + editing modal]
    N --> T[Profile view + user posts + actions]
    O --> U[Login form + auth validation]
    P --> V[Register form + account creation]

    %% Auth and guard flow
    R --> AA{Authenticated?}
    S --> AB{Authenticated?}
    T --> AC{Authenticated?}
    AA -->|No| AD[redirect to /login]
    AB -->|No| AD
    AC -->|No| AD
    AA -->|Yes| AE[render post actions + create modal]
    AB -->|Yes| AF[render edit/delete comment actions]
    AC -->|Yes| AG[render profile actions]

    %% API data flow
    AH[API response payload] --> AI[posts-service.js / users-service.js / auth-service.js]
    AI --> AJ[Normalize and hydrate view models]
    AJ --> AK[render post/comment text content]

    %% Sanitization and autolinking
    AK --> AL[escapeHtml()]
    AL --> AM[autolinkText()]
    AM --> AN{URL detected in text?}
    AN -->|Yes| AO[create <a href="..." target="_blank" rel="noopener noreferrer"> anchors]
    AN -->|No| AP[plain text remains safe]
    AO --> AQ[Safe DOM Injection via innerHTML]
    AP --> AQ
    AQ --> AR[Posts and comments render without raw HTML injection]

    %% UI components
    AR --> AS[post-card.js]
    AR --> AT[post-detail-view.js]
    AS --> AU[openImageModal(src, alt)]
    AT --> AV[renderConfirmModal]
    AU --> AW[image-modal.js overlay lightbox]
    AV --> AX[confirm destructive actions before proceed]

    %% Toasts and theme integration
    I --> AY[themeController]
    AY --> AZ[localStorage theme persistence]
    AZ --> BA[document.documentElement[data-theme]]
    BA --> BB[CSS variables in global.css + components.css]

    R --> BC[renderCreatePostModal]
    S --> BC
    BC --> BD[showToast(message)]
    BD --> BE[temporary toast notification in body]

    %% Navigation and lifecycle cleanup
    BF[User clicks internal link or navigates] --> BG[data-link interception]
    BG --> BH[history.pushState + router.renderLocation]
    BH --> CI[closeImageModal()]
    CI --> CJ[cleanup previous view listeners and DOM state]
    CJ --> K

    %% Additional interactions
    BK[Esc key on lightbox] --> BL[closeImageModal]
    BM[Backdrop click on image modal] --> BL
    BN[Theme toggle button click] --> AY
    BO[Login / register submit] --> AI

    %% Styling / visual layer
    BB --> BP[Responsive card layouts, modals, buttons, dark mode]
    AW --> BP
    BE --> BP
```

## Deployment and Runtime Interpretation

### 1) Vercel routing entry
- The app is deployed as a static frontend bundle through Vercel.
- The rewrite rule in `vercel.json` redirects every unmatched route to `/index.html` so the SPA can handle client-side routing.
- Once the browser loads the shell page, the script bootstraps from `/frontend/js/app.js`.

### 2) SPA router lifecycle
- `app.js` creates the main application shell and calls `createRouter()`.
- The router matches routes such as `/`, `/post/:postId`, `/profile/:userId`, `/login`, and `/register`.
- Each route resolves to a specific view renderer, and the render callback clears prior modal state before mounting the next screen.

### 3) Data lifecycle and parsing pipeline
- API data enters from service modules and is passed into the view layer.
- User-generated text is sanitized with `escapeHtml()` before rendering into the DOM.
- Autolink detection uses `autolinkText()` to convert URL-like strings into anchor elements with `target="_blank"` and `rel="noopener noreferrer"`.
- The combined flow prevents raw HTML injection while still supporting clickable URLs inside posts and comments.

### 4) Interactive UI and stateful behavior
- Header actions include theme switching, auth-driven navigation, and logout handling.
- Post cards and detail views can open a lightbox image modal.
- Create/edit modals and confirm dialogs are mounted as needed for user actions.
- Toast notifications display transient success/error feedback and are removed automatically.
- Theme preference is stored in `localStorage` and applied to the document root so the full interface can switch between light and dark modes.

## Key Implementation Notes

- Root-absolute imports are used throughout the frontend, such as `/js/router/router.js`, `/js/components/header.js`, and `/js/utils/escape-html.js`.
- The app uses a custom router with browser history support instead of a framework router.
- Data is rendered through controlled template generation rather than blindly injecting raw API strings.
- The architecture is intentionally split into `services`, `router`, `views`, `components`, and `utils` to keep the SPA predictable and maintainable.
