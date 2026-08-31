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

## Level 2: Screen & View Lifecycle Flowcharts

This level documents the internal lifecycle of each rendered view: how it loads data, renders DOM, and reacts to user actions without a full page reload.

### Home View (`home-view.js`)

```mermaid
flowchart TD
    Mount["renderHomeView(container) invoked by router"] --> CheckAuth{"authStore.isAuthenticated()?"}
    CheckAuth -->|"Yes"| BuildCreateUi["Build CreatePostCard and CreatePostModal"]
    CheckAuth -->|"No"| SkipCreateUi["Skip post creation UI"]
    BuildCreateUi --> ShowLoading["Render loading state in container"]
    SkipCreateUi --> ShowLoading

    ShowLoading --> FetchPosts["postsService.getPosts(page) calls http-client.js"]
    FetchPosts --> ApiResult{"Response ok?"}
    ApiResult -->|"No"| ShowError["Render error state with retry action"]
    ShowError --> FetchPosts
    ApiResult -->|"Yes"| SortPosts["Sort posts by newest id"]
    SortPosts --> RenderFeed["renderPostList builds post feed"]
    RenderFeed --> RenderScroll["renderInfiniteScroll for pagination"]
    RenderScroll --> Composed["Replace container with CreatePostCard, feed, and scroll sentinel"]

    Composed --> UserOpensModal["User clicks CreatePostCard"]
    UserOpensModal --> ModalOpen["createPostModal.open()"]
    ModalOpen --> SubmitPost["User submits new post form"]
    SubmitPost --> CreateRequest["Modal posts data via posts-service.js and http-client.js"]
    CreateRequest --> OnSuccess["onSuccess callback receives created post"]
    OnSuccess --> Prepend["list.prepend(renderPostCard(post)) inserts card without reload"]

    Composed --> ScrollBottom["User reaches scroll sentinel"]
    ScrollBottom --> LoadNext["loadNextPage() fetches next page"]
    LoadNext --> AppendMore["Append additional post cards to existing list"]

    Composed --> UserDeletes["User deletes a post from a post card"]
    UserDeletes --> DeleteRequest["post-card.js issues delete request via posts-service.js"]
    DeleteRequest --> RemoveDom["Deleted post card removed reactively from DOM"]
```

### User Profile View (`user-profile-view.js`)

```mermaid
flowchart TD
    Mount["renderUserProfileView(container, { userId }) invoked by router"] --> Ownership["Compare authStore.getUser().id === userId"]
    Ownership --> OwnerCheck{"Viewer is profile owner?"}
    OwnerCheck -->|"Yes"| ShowCreateCard["Render CreatePostCard for owner"]
    OwnerCheck -->|"No"| HideCreateCard["Hide CreatePostCard for visitor"]
    ShowCreateCard --> ShowLoading["Render loading state"]
    HideCreateCard --> ShowLoading

    ShowLoading --> FetchBoth["Promise.all: usersService.getUser(userId) and postsService.getUserPosts(userId)"]
    FetchBoth --> BothOk{"Both responses ok?"}
    BothOk -->|"No"| ShowError["Render error state with failure message"]
    BothOk -->|"Yes"| BuildHeader["Build heading and counter text: @username | X posts"]
    BuildHeader --> PostsCheck{"posts.length === 0?"}
    PostsCheck -->|"Yes"| RenderEmpty["Render Empty State Card"]
    PostsCheck -->|"No"| RenderList["renderPostList with sorted posts"]
    RenderEmpty --> Composed["Replace container with heading, counter, CreatePostCard if owner, and posts area"]
    RenderList --> Composed

    Composed --> OwnerCreates["Owner submits new post via CreatePostCard modal"]
    OwnerCreates --> IncrementCounter["postsCount incremented and counter text updated"]
    IncrementCounter --> PrependCard["New post card prepended or replaces Empty State Card"]

    Composed --> AnyoneDeletes["Post card emits onDelete for a listed post"]
    AnyoneDeletes --> DecrementCounter["postsCount decremented and counter text updated"]
    DecrementCounter --> EmptyRecheck{"postsCount === 0?"}
    EmptyRecheck -->|"Yes"| SwapEmpty["Replace posts container with Empty State Card"]
    EmptyRecheck -->|"No"| KeepList["Post removed from list, remaining cards stay"]
```

### Auth Views (`login-view.js` and `register-view.js`)

The application implements login and registration as two dedicated views rather than a single combined auth view, sharing the same submit-validate-store lifecycle.

```mermaid
flowchart TD
    Mount["renderLoginView or renderRegisterView(container) invoked by router"] --> BuildForm["Build form with username, password, and submit control"]
    BuildForm --> TabLink["Form includes link to switch between #/login and #/register"]
    TabLink --> UserSwitch["User clicks link"]
    UserSwitch --> Router["router.js navigates to the other auth route"]
    Router --> Mount

    BuildForm --> UserSubmits["User submits form"]
    UserSubmits --> DisableSubmit["Disable submit button and clear previous error"]
    DisableSubmit --> Validate["Browser required-field validation on inputs"]
    Validate --> AuthRequest["auth-service.js calls http-client.js: login() or register()"]
    AuthRequest --> AuthResult{"Response ok?"}
    AuthResult -->|"No"| ShowFormError["Render error state and re-enable submit"]
    AuthResult -->|"Yes"| StoreToken["Save JWT token to LocalStorage and update authStore"]
    StoreToken --> NotifySubscribers["authStore notifies header and app.js subscribers"]
    NotifySubscribers --> HeaderUpdate["Header UI updates to authenticated state"]
    NotifySubscribers --> Redirect["navigate(\"#/\") redirects to Home or Profile"]
```

### Post Detail View (`post-detail-view.js`)

```mermaid
flowchart TD
    Mount["renderPostDetailView(container, { postId }) invoked by router"] --> ShowLoading["Render loading state"]
    ShowLoading --> FetchPost["postsService.getPost(postId) calls http-client.js, includes comments"]
    FetchPost --> ApiResult{"Response ok?"}
    ApiResult -->|"No"| ShowError["Render error state with retry action"]
    ShowError --> FetchPost
    ApiResult -->|"Yes"| RenderMain["Render main post card via renderPostCard(post)"]
    RenderMain --> RenderComments["renderComments builds comment list from post.comments"]
    RenderComments --> AuthCheck{"authStore.isAuthenticated()?"}
    AuthCheck -->|"Yes"| RenderCommentForm["Render comment textarea and submit button"]
    AuthCheck -->|"No"| SkipCommentForm["Comment form not rendered"]
    RenderCommentForm --> Composed["Replace container with post card, comments section, and edit modal"]
    SkipCommentForm --> Composed

    Composed --> UserComments["User submits comment form"]
    UserComments --> ValidateBody{"Comment body non-empty?"}
    ValidateBody -->|"No"| ShowValidationError["Show inline required-comment error"]
    ValidateBody -->|"Yes"| CommentRequest["commentsService.createComment(postId, body) calls http-client.js"]
    CommentRequest --> CommentResult{"Response ok?"}
    CommentResult -->|"No"| ShowToastError["Show toast and inline error, re-enable submit"]
    CommentResult -->|"Yes"| PrependComment["Prepend new comment to comments list without page reload"]
    PrependComment --> UpdateCount["Update post.commentsCount and comments counter text"]
    UpdateCount --> ClearForm["Clear textarea and re-enable submit button"]
```
