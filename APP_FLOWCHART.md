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
    NotifySubscribers --> Redirect["navigate to #/ redirects to Home or Profile"]
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

## Level 3: Core Modules & Services Flowcharts

### Router Service (`router.js`)

```mermaid
flowchart TD
    BrowserEvent["Browser hashchange or load event"] --> RenderLocation["renderLocation reads current hash path"]
    RenderLocation --> ExtractPath["getHashPath extracts path and removes query string"]
    ExtractPath --> MatchRoute["matchRoute compares path with configured routes"]
    MatchRoute --> CompilePattern["compileRoute converts static and parameter segments into regex"]
    CompilePattern --> RouteFound{"Route pattern matched?"}
    RouteFound -->|"Yes"| ExtractParams["Decode dynamic values into params object"]
    RouteFound -->|"No"| Fallback["Match configured /404 fallback route"]
    ExtractParams --> RenderCallback["Call application render callback with route and root"]
    Fallback --> RenderCallback
    RenderCallback --> GuardCheck{"Protected route and unauthenticated?"}
    GuardCheck -->|"Yes"| LoginRedirect["navigate to #/login"]
    LoginRedirect --> RenderLocation
    GuardCheck -->|"No"| RenderView["Render selected view"]
```

The router listens for hash changes and initial page load. It matches both static paths and parameterized paths such as `/users/:userId`; `app.js` performs the protected-route guard in its render callback before rendering a view.

### HTTP Client Service (`http-client.js`)

```mermaid
flowchart TD
    Request["Service calls request, get, post, put, or delete"] --> BuildUrl["Join API base URL with request path"]
    BuildUrl --> BuildHeaders["Set Accept header and merge request headers"]
    BuildHeaders --> TokenCheck{"Authentication token present?"}
    TokenCheck -->|"Yes"| AttachToken["Attach Authorization Bearer token header"]
    TokenCheck -->|"No"| PrepareBody["Prepare request body"]
    AttachToken --> PrepareBody
    PrepareBody --> FetchRequest["Call fetch wrapper"]
    FetchRequest --> Response["Receive HTTP response"]
    Response --> ParseJson["Parse JSON, text, or empty response"]
    ParseJson --> Unauthorized{"Response status is 401?"}
    Unauthorized -->|"Yes"| PurgeToken["Clear auth store session"]
    Unauthorized -->|"No"| StatusCheck{"Response status successful?"}
    PurgeToken --> StatusCheck
    StatusCheck -->|"Yes"| Success["Return standard successful API result"]
    StatusCheck -->|"No"| ApiError["Format and return standard API error"]
    FetchRequest --> NetworkError["Return standard network error on fetch failure"]
```

### Auth Store (`auth-store.js`)

```mermaid
flowchart TD
    Initialize["Create auth store"] --> LoadStorage["Read persisted session from LocalStorage"]
    LoadStorage --> InitialState["Initialize token and user state"]
    InitialState --> ListenerSet["Create listeners subscription set"]

    Login["Login or registration succeeds"] --> SetToken["setToken or setSession stores token"]
    SetToken --> SetUser["setUser or setSession stores user"]
    SetUser --> Persist["Persist session in LocalStorage"]
    Logout["Logout or HTTP unauthorized response"] --> Clear["clear removes token and user"]
    Clear --> RemoveStorage["Remove persisted session from LocalStorage"]
    Persist --> Notify["Notify every subscribed listener with current state"]
    RemoveStorage --> Notify
    ListenerSet --> Subscribe["Header and application views subscribe"]
    Notify --> HeaderUpdate["Update Header UI authentication controls"]
    Notify --> ViewUpdate["Re-render active route and update views"]
```

## Level 4: Code-Level Function Call & Execution Sequence

### 4.1 User Roles, Permissions & Post Creation Function Execution Flow

```mermaid
flowchart TD
    subgraph PartA["Part A: User Roles and Permission Checks"]
        GuestStart["Guest User"] --> GuestFeed["View public post feed"]
        GuestStart --> GuestDetail["View post details"]
        GuestStart --> GuestProfile["View public user profiles"]
        GuestStart --> GuestBlocked["Attempt create/edit/delete post or comment"]
        GuestBlocked --> GuestRedirect["Redirect to login/register views"]
        GuestRedirect --> LoginView["login-view.js"]
        GuestRedirect --> RegisterView["register-view.js"]

        LoginView --> LoginSubmit["Submit login form"]
        RegisterView --> RegisterSubmit["Submit registration form"]
        LoginSubmit --> AuthService["auth-service.js"]
        RegisterSubmit --> AuthService
        AuthService --> AuthSuccess["Successful auth response"]
        AuthSuccess --> SaveToken["auth-store.js: save JWT token and user session"]
        SaveToken --> AuthUser["Authenticated User"]

        AuthUser --> CreatePostAccess["Create new posts"]
        AuthUser --> CommentAccess["Comment on posts"]
        AuthUser --> EditOwn["Edit own posts"]
        AuthUser --> DeleteOwn["Delete own posts"]
        AuthUser --> FullAccess["Full privileges unlocked"]
    end

    subgraph PartB["Part B: Post Creation Execution Sequence"]
        StartCreate["Authenticated user starts post creation"] --> AuthCheck{"authStore.isAuthenticated() returns true?"}
        AuthCheck -->|"Yes"| TriggerClick["User clicks create-post trigger card"]
        AuthCheck -->|"No"| BlockedCreate["Block action and redirect to login"]

        TriggerClick --> OpenModal["openCreatePostModal()"]
        OpenModal --> SubmitHandler["Form submit listener fires: handlePostSubmit(event)"]
        SubmitHandler --> PayloadBuild["Construct request payload from form input"]
        PayloadBuild --> ApiCall["http-client.js: post('/posts', body)"]
        ApiCall --> ResponseCheck{"Response status is 201 Created?"}
        ResponseCheck -->|"Yes"| OnSuccess["onSuccess(newPost)"]
        ResponseCheck -->|"No"| ErrorState["Display API or validation error"]

        OnSuccess --> RenderCard["renderPostCard(newPost)"]
        RenderCard --> PrependDom["feedContainer.prepend(postElement)"]
        PrependDom --> UpdateState["incrementPostCounter() and hide .user-posts__empty if visible"]
        UpdateState --> SuccessEnd["New post appears at top of feed"]
    end
```

This Level 4 adds the code-level permission model and the exact function chain for creating a post. Guests can browse publicly, while any write attempt is intercepted and redirected to authentication. Once authenticated, the post flow progresses through modal open, submit handler, HTTP request, success callback, DOM insertion, and state updates that make the new post immediately visible in the current feed.

### 4.2 Post Edit & Deletion Execution Flow

```mermaid
flowchart TD
    subgraph PartA["Part A: Post Deletion Sequence"]
        DeleteClick["User clicks delete icon in post-card.js"] --> OwnershipCheck{"post.author.id === currentUser.id?"}
        OwnershipCheck -->|"No"| DenyDelete["Do not expose or execute delete action"]
        OwnershipCheck -->|"Yes"| OpenConfirm["renderConfirmModal() opens delete confirmation"]
        OpenConfirm --> ConfirmDelete["User confirms delete action"]
        ConfirmDelete --> DeletePost["postsService.deletePost(postId)"]
        DeletePost --> DeleteRequest["http-client.js: delete('/posts/' + postId)"]
        DeleteRequest --> DeleteResult{"API returns 200 OK?"}
        DeleteResult -->|"No"| DeleteError["Show deletion error in confirmation modal"]
        DeleteResult -->|"Yes"| RemoveCard["postElement.remove() removes the card without page reload"]
        RemoveCard --> DeleteCallback["onDelete(post) updates profile state"]
        DeleteCallback --> DecrementCount["Decrement counter: @username | X posts"]
        DecrementCount --> EmptyCheck{"Remaining profile post elements === 0?"}
        EmptyCheck -->|"Yes"| InjectEmpty["Inject .user-posts__empty"]
        EmptyCheck -->|"No"| KeepPosts["Keep remaining profile post elements"]
    end

    subgraph PartB["Part B: Post Editing Sequence"]
        EditClick["User clicks edit icon in post-card.js"] --> EditOwnership{"post.author.id === currentUser.id?"}
        EditOwnership -->|"No"| DenyEdit["Do not expose or execute edit action"]
        EditOwnership -->|"Yes"| EmitEdit["onEdit(post) opens the edit modal"]
        EmitEdit --> PrefillModal["createPostModal.open(post) sets editingPost and pre-fills text and image data"]
        PrefillModal --> EditingMode["isEditing is true while editingPost is present"]
        EditingMode --> EditSubmit["Form submit triggers handlePostEdit(event)"]
        EditSubmit --> UpdatePost["postsService.updatePost(postId, updatedBody)"]
        UpdatePost --> PutRequest["http-client.js: put('/posts/' + postId, updatedBody)"]
        PutRequest --> EditResult{"API returns updated post object?"}
        EditResult -->|"No"| EditError["Show validation or API error in modal"]
        EditResult -->|"Yes"| EditSuccess["onSuccess(updatedPost) receives updated post data"]
        EditSuccess --> UpdateCard["Update title, body, and image in the existing post card without re-rendering the feed list"]
    end
```

This flow follows the post-card action handlers through confirmation or editing state, the post service, and reactive UI updates. Deletion removes the existing card and updates the profile counter; editing updates the current card from the returned post data.

### 4.3 Comments & Session Lifecycle Execution Flow

```mermaid
flowchart TD
    subgraph PartA["Part A: Comment Creation Sequence"]
        NavigateDetail["User navigates to #/posts/:id"] --> RenderDetail["renderPostDetailView(container, { postId })"]
        RenderDetail --> Authenticated["Authenticated user sees comment form"]
        Authenticated --> TypeComment["User types comment text"]
        TypeComment --> SubmitComment["User clicks Comment submit button"]
        SubmitComment --> HandleSubmit["Inline handleCommentSubmit(event) form submit listener"]
        HandleSubmit --> PreventDefault["event.preventDefault() and input.value.trim()"]
        PreventDefault --> ValidBody{"Comment body is non-empty?"}
        ValidBody -->|"No"| ValidationError["Display required-comment error"]
        ValidBody -->|"Yes"| CreateComment["commentsService.createComment(postId, body)"]
        CreateComment --> PostRequest["http-client.js: post('/posts/' + postId + '/comments', body)"]
        PostRequest --> Created{"API returns 201 Created?"}
        Created -->|"No"| CommentError["Show toast and inline error, then re-enable submit"]
        Created -->|"Yes"| NewComment["Receive new comment object"]
        NewComment --> AppendComment["commentsList.prepend(renderCommentItem(createdComment))"]
        AppendComment --> UpdateComments["Add new comment to post.comments"]
        UpdateComments --> IncrementCount["Increment post.commentsCount and update counter text"]
        IncrementCount --> ResetForm["Clear textarea and re-enable submit without page refresh"]
    end

    subgraph PartB["Part B: Session Lifecycle and Auto-Logout Flow"]
        LogoutStart["User initiates logout from Header"] --> HeaderLogout["Header invokes onLogout callback"]
        HeaderLogout --> ServiceLogout["authService.logout()"]
        ServiceLogout --> ClearSession["authStore.clear() acts as logout"]
        ClearSession --> ClearState["Set JWT token and user object to null"]
        ClearState --> ClearStorage["Remove tarmeez.auth from LocalStorage"]
        ClearStorage --> NotifySubscribers["Notify authStore subscribers"]
        NotifySubscribers --> HeaderGuest["Header UI updates to Guest state"]
        NotifySubscribers --> RerenderRoute["app.js subscription calls router.render()"]
        RerenderRoute --> ProtectedCheck{"Current route requires authentication?"}
        ProtectedCheck -->|"Yes"| LoginRedirect["router.navigate('#/login')"]
        ProtectedCheck -->|"No"| PublicRoute["Re-render current public route as guest"]

        AnyRequest["Any http-client.js request"] --> Response401{"Response status is 401 Unauthorized?"}
        Response401 -->|"No"| NormalResponse["Return standard API success or error result"]
        Response401 -->|"Yes"| AutoClear["http-client.js calls authStore.clear()"]
        AutoClear --> ClearState
    end
```

Comment creation keeps the detail view mounted: its submit listener validates the body, creates the comment through the service and HTTP client, then prepends the returned element and updates the in-memory count. Session clearing is shared by explicit logout and unauthorized API responses; store subscribers refresh the header and rerun route protection, which redirects protected views to `#/login`.
