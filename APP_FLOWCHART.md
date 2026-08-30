# Tarmeez Application Flowchart

**Version:** v2.0 - Hash Routing & Responsive Header

```mermaid
graph TD
    A[frontend/index.html<br/>Application bootstrap] --> B[app.js<br/>Create header, main element, and router]
    B --> C[router.start()]
    C --> D[window.location.hash]
    D --> E[getHashPath()<br/>Normalize hash to route path]
    E --> F{router.js matches configured route}
    F -->|#/ or /| G[Home view]
    F -->|#/users/:id| H[User profile view]
    F -->|#/posts/:id| I[Post detail view]
    F -->|#/login or #/register| J[Authentication view]
    F -->|No match| K[404 route]
    G --> L[renderRoute()<br/>Clean previous view and render active view]
    H --> L
    I --> L
    J --> L
    K --> L

    M[User clicks a data-link anchor] --> N[router.js intercepts click]
    N --> O[navigate(path)]
    O --> P[Set window.location.hash]
    P --> Q[hashchange]
    Q --> D

    R[Login or logout] --> S[authStore updates persisted state]
    S --> T[authStore.notify()]
    T --> U[Header subscription]
    T --> V[app.js subscription]
    V --> W[router.render()<br/>Re-render active route]
    W --> D

    B --> X[renderHeader()]
    X --> Y[header.update(auth state)]
    U --> Y
    Y --> Z{Authenticated?}
    Z -->|Guest| AA[Desktop: show Login and Register<br/>hide user menu with style.display]
    AA --> AB[Mobile drawer: show Login and Register<br/>hide user, profile, and logout]
    Z -->|Logged in| AC[Desktop: show user trigger<br/>hide Login and Register with style.display]
    AC --> AD[Avatar click toggles desktop dropdown<br/>userDropdown.hidden]
    AC --> AE[Mobile drawer: show user, profile, and logout<br/>hide Login and Register]
    AE --> AF[Hamburger click toggles drawer<br/>mobileDrawer.hidden]
    AD --> AG[Outside click closes dropdown]
    AF --> AH[Outside click or drawer navigation closes drawer]

    L --> AI[View requests API data]
    AI --> AJ[services fetch JSON]
    AJ --> AK[Posts array]
    AK --> AL[Sort by numeric ID descending<br/>newest first]
    AL --> AM[renderPostList()]
    AM --> AN[renderPostCard()]
    AN --> AO[Plain text values]
    AO --> AP[escapeHtml()]
    AP --> AQ[Safe text DOM rendering]
    AN --> AR[Post body]
    AR --> AS[autolinkText()]
    AS --> AT[Escape non-URL text and URL attributes]
    AT --> AU[Safe linked HTML DOM rendering]
```

The router reads and writes browser hashes, so navigation updates the active view without server-side route handling. Header controls subscribe to `authStore`; the app also re-renders the active route after every authentication change to keep protected and owner-only controls current. Home and profile post lists sort numeric IDs descending before post components escape text or safely autolink body content.
