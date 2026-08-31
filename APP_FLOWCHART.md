# Tarmeez Application Architecture Guide

This guide describes Tarmeez through progressive levels of detail. Level 1 presents the system-wide request, routing, authentication, rendering, and data-flow boundaries. Later levels will document individual features and implementation paths without repeating this architectural overview.

## Level 1: System High-Level Architecture

```mermaid
flowchart TD
    Browser["Browser"] --> Index["frontend/index.html: application entry point"]
    Index --> App["frontend/js/app.js: bootstrap application shell"]

    App --> Shell["Create header and main application DOM"]
    Shell --> RouterStart["router.start()"]
    RouterStart --> Router["router.js: read hash path and match route"]
    Browser --> Navigation["User navigation or browser hash change"]
    Navigation --> Router

    Router --> MatchedRoute["Matched route and route parameters"]
    MatchedRoute --> Guard["app.js: protected-route guard"]
    Guard --> AuthStore["auth-store.js: persisted session and authentication state"]
    AuthStore --> AuthDecision{"Authenticated for protected route?"}
    AuthDecision -->|"No"| LoginRoute["Redirect to login route"]
    LoginRoute --> Router
    AuthDecision -->|"Yes or public route"| RenderRoute["app.js: clear previous view and render active view"]

    RenderRoute --> HomeView["home-view.js"]
    RenderRoute --> ProfileView["user-profile-view.js"]
    RenderRoute --> AuthViews["login-view.js and register-view.js: authentication views"]
    RenderRoute --> DetailView["post-detail-view.js"]

    HomeView --> Services["Service layer: posts, users, tags, comments, and auth services"]
    ProfileView --> Services
    AuthViews --> Services
    DetailView --> Services
    Services --> HttpClient["http-client.js: API fetch calls with auth token"]
    HttpClient --> Backend["Tarmeez Backend API"]
    Backend --> ApiResponse["API response or request error"]
    ApiResponse --> Services
    Services --> ReactiveView["Views normalize data and update inserted DOM"]
    ReactiveView --> MainDom["Main application DOM"]

    AuthViews --> AuthUpdate["Authentication response updates auth store"]
    HttpClient --> Unauthorized["401 response clears auth store"]
    AuthUpdate --> AuthStore
    Unauthorized --> AuthStore
    AuthStore --> Subscribers["Header and app.js authentication subscriptions"]
    Subscribers --> HeaderUpdate["Header controls update"]
    Subscribers --> RouteRefresh["Router re-renders active route"]
    RouteRefresh --> Router
```

At startup, `index.html` loads `app.js`, which mounts the application shell and starts hash-based routing. Each matched route passes through the authentication guard before a view is inserted into the main DOM. Views request data through services and the shared HTTP client; successful and failed responses update the active UI. Authentication state changes notify the header and re-render the current route so the visible interface remains consistent with the session.
