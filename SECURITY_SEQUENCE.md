# Tarmeez Security and Routing Sequence

**Version:** v2.0 - Security & Route Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Browser Window
    participant Router as Router
    participant App as app.js / renderRoute
    participant View as Active Route Component
    participant API as REST API
    participant Posts as Posts Service
    participant Normalizer as API Normalizers
    participant Sanitizer as escapeHtml() / autolinkText()
    participant DOM as Safe DOM
    participant Auth as AuthStore
    participant Storage as localStorage
    participant Header as Header

    rect rgb(232, 244, 255)
        Note over User,View: User request / route change: hash routing event loop
        User->>Browser: Click data-link or change URL hash
        Browser->>Router: hashchange event
        Router->>Router: getHashPath() and matchRoute()
        Router->>App: render(route, root)
        App->>App: Check route.protected
        alt Protected route and unauthenticated
            App->>Auth: isAuthenticated()
            Auth-->>App: false
            App->>Router: navigate("#/login")
            Router->>App: Render login route
        else Public or authenticated route
            App->>View: Initialize active route component
        end
    end

    rect rgb(237, 250, 238)
        Note over View,DOM: API fetching, data normalization, and XSS sanitization before DOM insertion
        View->>Posts: getPosts(), getPost(), or getUserPosts()
        Posts->>API: HTTP request
        API-->>Posts: Raw JSON payload
        Posts->>Normalizer: normalizePage() / normalizePost()
        Normalizer-->>View: Normalized post data
        View->>Sanitizer: escapeHtml(title, author, tags, metadata)
        Sanitizer-->>View: HTML-escaped text
        View->>Sanitizer: autolinkText(post body or comment)
        Sanitizer->>Sanitizer: Escape non-URL text and URL attributes
        Sanitizer-->>View: Sanitized linked HTML
        View->>DOM: Insert only escaped or sanitized content
    end

    rect rgb(255, 247, 232)
        Note over User,Header: Auth control flow and direct authenticated state checks
        User->>Header: Log in or log out interaction
        Header->>Auth: setSession() or clear()
        Auth->>Storage: Persist or remove tarmeez.auth
        Auth->>Auth: update state and notify listeners
        par Header subscriber
            Auth-->>Header: Updated auth state
            Header->>Auth: getState() / isAuthenticated()
            Header->>Header: Show guest controls or user menu
        and Active view subscriber
            Auth-->>App: Auth-state notification
            App->>Router: router.render()
            Router->>App: Resolve current hash route
            App->>Auth: isAuthenticated()
            App->>View: Re-render active route and owner-only controls
        end
        View->>Auth: isAuthenticated() before owner-only actions
        Auth-->>View: Current authenticated state
    end
```

The browser hash is the routing source of truth. Before a protected route renders, `app.js` checks `authStore.isAuthenticated()` and redirects guests to login. REST data is normalized before the view consumes it; every dynamic text value is passed through `escapeHtml()` or `autolinkText()` before HTML insertion. Authentication changes persist state, notify the Header, and re-render the active route so protected and owner-only controls reflect the current session.