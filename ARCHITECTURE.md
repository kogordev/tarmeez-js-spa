# Tarmeez SPA Architecture

## 1. Scope

This document defines the architecture for a Vanilla JavaScript single-page application consuming the Tarmeez API. It is an analysis and implementation blueprint only. No application code, routes, dependencies, or API calls are added as part of this document.

The current repository is a plain Express static server with a Vanilla JS frontend. The existing server serves `frontend/` and falls back to `frontend/index.html` for client-side routes. The browser is expected to call the remote API directly unless a later CORS requirement justifies adding an Express proxy.

## 2. API Overview

**Base URL**

```text
https://tarmeezacademy.com/api/v1
```

**API groups**

- Auth
- User
- Posts
- Comments
- Tags

**Common headers**

```http
Accept: application/json
Authorization: Bearer <token>
Content-Type: application/json
```

`Content-Type: multipart/form-data` is required for upload forms. The browser should set the multipart boundary automatically when a `FormData` object is passed to `fetch`; the client must not manually set that header.

**Evidence labels**

- **Postman-documented**: visible in the supplied Postman documentation.
- **Live-observed**: confirmed from a request to the public API.
- **Inferred**: likely based on naming or normal REST behavior, but not exposed clearly by the documentation.
- **Unresolved**: must be verified before the corresponding implementation is treated as a stable contract.

The Postman collection applies Bearer metadata at collection or folder level in places where the example curl request does not send a token. Auth requirements below follow the request examples and live behavior where available, not inherited display metadata alone.

## 3. Endpoint Inventory

### 3.1 Auth

#### `POST /register`

- **Auth:** Public. The Postman page displays inherited Bearer metadata, but the example request does not send `Authorization`.
- **Request:** `multipart/form-data`.
- **Fields:**
  - `username`: string, required.
  - `password`: string, required.
  - `name`: string, required or validation-dependent.
  - `email`: string, required or validation-dependent.
  - `image`: optional upload; inferred from the form-data schema and registration design.
- **Example request:**

```bash
curl --location 'https://tarmeezacademy.com/api/v1/register' \
  --header 'Accept: application/json' \
  --form 'username="yarob"' \
  --form 'password="123456"' \
  --form 'name="Yarob"' \
  --form 'email="yarob.hm@gmail.com"'
```

- **Response:** The Postman example states that there is no response body.
- **Status:** Not exposed by the published example. Verify success and validation status codes before implementation.
- **Implementation note:** Submit with `FormData`. Do not assume registration also logs the user in unless the runtime response confirms it.

#### `POST /login`

- **Auth:** Public. The example request does not send `Authorization`.
- **Request:** JSON.
- **Payload:**

```json
{
  "username": "yarob",
  "password": "HelloWorld"
}
```

- **Response:** The Postman example states that there is no response body, which conflicts with the normal need for a login token.
- **Token shape:** Unresolved. Verify the successful response and identify the exact token field before implementing persistent authentication.
- **Implementation note:** The API client must not hard-code a response shape based only on the empty example in the documentation.

#### `POST /logout`

- **Auth:** Bearer token required according to the request authorization settings.
- **Displayed request body:**

```json
{
  "username": "yarob",
  "password": "HelloWorld"
}
```

This body appears to be inherited or stale metadata because logout should normally use the bearer token and does not need credentials in the body.

- **Response:** The Postman example states that there is no response body.
- **Status:** Not exposed by the published example.
- **Implementation note:** Send the bearer token, tolerate an empty success response, and clear the local session regardless of whether a response body is returned.

### 3.2 Users

#### `GET /users?page={page}`

- **Auth:** Public; live-observed without authentication.
- **Query parameters:**
  - `page`: numeric page number. Optional; defaults to the first page.
- **Response:** Paginated Laravel-style envelope.

```json
{
  "data": [
    {
      "id": 1,
      "username": "abd19",
      "name": "Example User",
      "email": "user@example.com",
      "profile_image": "https://example.com/images/users/profile.jpg",
      "posts_count": 3,
      "comments_count": 13
    }
  ],
  "links": {
    "first": "https://tarmeezacademy.com/api/v1/users?page=1",
    "last": "https://tarmeezacademy.com/api/v1/users?page=10",
    "prev": null,
    "next": "https://tarmeezacademy.com/api/v1/users?page=2"
  },
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "from": 1,
    "to": 15,
    "total": 150
  }
}
```

The exact totals vary with live data. The observed page size was 15.

#### `GET /users/{userId}`

- **Auth:** Public; live-observed without authentication.
- **Path parameters:**
  - `userId`: numeric user identifier.
- **Response:** `{ "data": User }`.
- **User fields:** `id`, `username`, `name`, `email`, `profile_image`, `posts_count`, `comments_count`, and optional `created_at`/`updated_at` fields. Nullable and missing values must be supported.

### 3.3 Posts

#### `GET /posts?page={page}`

- **Auth:** Public; live-observed without authentication.
- **Query parameters:**
  - `page`: numeric page number. Optional; defaults to the first page.
- **Response:** Paginated Laravel-style envelope with `data`, `links`, and `meta`.
- **Observed pagination:** 15 posts per page. The envelope includes `current_page`, `last_page`, `per_page`, `from`, `to`, `total`, and navigation links.
- **List item shape:**

```json
{
  "id": 20784,
  "title": "Example title",
  "body": "Example body",
  "author": {
    "id": 1,
    "username": "example-user",
    "name": "Example User",
    "profile_image": {}
  },
  "image": "https://tarmeezacademy.com/images/posts/example.jpg",
  "tags": [],
  "created_at": "16 hours ago",
  "comments_count": 0
}
```

`title` may be null. `image` may be a URL, an empty object, null, or absent.

#### `GET /posts/{postId}`

- **Auth:** Public; live-observed without authentication.
- **Path parameters:**
  - `postId`: numeric post identifier.
- **Response:** `{ "data": Post }`.
- **Additional detail data:** Post details include embedded `comments`.

```json
{
  "data": {
    "id": 20784,
    "title": "Example title",
    "body": "Example body",
    "author": {},
    "image": {},
    "tags": [],
    "created_at": "16 hours ago",
    "comments_count": 1,
    "comments": [
      {
        "id": 2,
        "body": "Example comment",
        "author": {}
      }
    ]
  }
}
```

#### `POST /posts`

- **Auth:** Bearer token required.
- **Request:** Likely `multipart/form-data` because posts can include an image. The exact published body is not exposed reliably.
- **Likely fields:**
  - `title`: string, possibly nullable.
  - `body`: string, required.
  - `image`: optional upload.
  - Tag fields: unresolved; do not assume a field name until verified.
- **Response/status:** The exact response body and success status are not exposed by the published example. A created resource and HTTP 201 are reasonable expectations, not guaranteed API facts.
- **Implementation note:** Verify field names, required values, image behavior, tags, and response shape before building the create-post form.

#### `DELETE /posts/{postId}`

- **Auth:** Bearer token required. Ownership authorization is expected.
- **Path parameters:**
  - `postId`: numeric post identifier.
- **Response/status:** Exact success body and status are undocumented. Support either an empty response such as 204 or a JSON success message.
- **Failure cases:** Expect possible 401 unauthenticated, 403 not owner, and 404 missing post responses, but verify exact API behavior.

#### Post update operations

`PUT /posts/{postId}` and `PATCH /posts/{postId}` were not confirmed by the rendered collection. They are excluded from the initial architecture contract until the collection is directly verified.

#### Post filtering

Possible query filters such as `tag` or `user_id` are not guaranteed. Live probes did not establish that they filter results. The service layer may accept future query parameters, but the first implementation must not expose filtering UI as a confirmed feature without verification.

### 3.4 Comments

#### `POST /posts/{postId}/comments`

- **Auth:** Bearer token required.
- **Path parameters:**
  - `postId`: numeric post identifier.
- **Payload:** A `body` field is expected. Whether the endpoint requires JSON or form encoding is unresolved.

Likely JSON form:

```json
{
  "body": "Example comment"
}
```

- **Response/status:** A created comment and HTTP 201 are reasonable expectations, but the published documentation does not expose a reliable response or status.
- **Implementation note:** Verify encoding and response shape before finalizing `comments-service.js`.

#### `DELETE /comments/{commentId}`

- **Auth:** Bearer token required. Ownership authorization is expected.
- **Path parameters:**
  - `commentId`: numeric comment identifier.
- **Response/status:** Exact success body and status are undocumented. Support an empty response or JSON success message.

#### `GET /posts/{postId}/comments`

This route is not a first-implementation dependency. A live probe returned HTTP 500. Post detail responses already embed comments, so the initial application should read comments from `GET /posts/{postId}`.

### 3.5 Tags

#### `GET /tags`

- **Auth:** Public; live-observed without authentication.
- **Parameters:** None observed.
- **Response:** Non-paginated data envelope.

```json
{
  "data": [
    {
      "name": "sports",
      "arabic_name": "Arabic label",
      "description": "everything about sports"
    }
  ]
}
```

The API returned four sample tags in the live response. The data set may change.

#### `GET /tags/{tag}`

This route is not part of the guaranteed contract. A live probe of `/tags/sports` returned HTTP 404. A tag directory may link to filtered posts only after the API's supported filtering convention is verified.

## 4. Domain Models

The UI should consume normalized models so components do not need to understand every API inconsistency.

### User

```text
User {
  id: number
  username: string
  name: string
  email: string | null
  profileImageUrl: string | null
  postsCount: number | null
  commentsCount: number | null
  createdAt: string | null
  updatedAt: string | null
}
```

### Post

```text
Post {
  id: number
  title: string | null
  body: string
  author: User | null
  imageUrl: string | null
  tags: Tag[]
  createdAt: string | null
  commentsCount: number
  comments: Comment[] | null
}
```

### Comment

```text
Comment {
  id: number
  body: string
  author: User | null
}
```

### Tag

```text
Tag {
  name: string
  arabicName: string | null
  description: string | null
}
```

Normalization must tolerate `{}`, null, missing image fields, unusable localhost URLs, null titles, and either ISO or human-readable timestamps.

## 5. SPA Routes and Pages

The router uses the History API and maps browser paths to route-level views.

| Route | Access | View responsibility | Primary API calls |
|---|---|---|---|
| `/` | Public | Redirect or render the post feed. | `GET /posts` |
| `/posts` | Public | Paginated feed, post cards, loading/empty/error states, pagination. | `GET /posts?page={page}` |
| `/posts/:id` | Public | Post detail, author, tags, image, embedded comments, and authenticated mutation controls. | `GET /posts/{postId}` |
| `/users` | Public | Paginated user directory. | `GET /users?page={page}` |
| `/users/:id` | Public | User profile summary and counts. Associated posts are not assumed until a supported API query is verified. | `GET /users/{userId}` |
| `/tags` | Public | Tag directory with names and descriptions. | `GET /tags` |
| `/login` | Public | Username/password authentication form. | `POST /login` |
| `/register` | Public | Registration form with optional image upload. | `POST /register` |
| `/settings` | Authenticated | Account actions such as logout. No profile editing is promised. | `POST /logout` |
| `/404` | Public | Unknown-route state with navigation back to a known page. | None |

Create-post UI may be added as an authenticated modal or route after the exact `POST /posts` contract is verified. It is not assigned a guaranteed route yet.

## 6. UI Components

Components render DOM and emit user-intent events. They do not call `fetch` or import resource services directly.

### Application shell

- `AppShell`: mounts the active view and shared layout.
- `Header`: navigation, authentication state, user menu, and logout action.
- `Navigation`: links using `data-link` or router helpers so navigation stays client-side.

### Resource components

- `PostList`: renders a collection of post cards.
- `PostCard`: summary title, body excerpt, author, image, tags, timestamp, and comment count.
- `PostDetail`: full post body, author link, tags, image, comments, and mutation actions.
- `UserCard`: compact user summary for the directory.
- `UserProfile`: user identity and activity counts.
- `TagList`: collection of tags and descriptions.
- `TagBadge`: compact tag representation.
- `CommentList`: comments embedded in post detail.
- `CommentForm`: authenticated form for creating a comment.

### Form and state components

- `AuthForm`: shared validation and submission presentation for login/register variants.
- `Pagination`: consumes pagination metadata and emits page changes.
- `LoadingState`: pending request feedback.
- `EmptyState`: successful request with no items.
- `ErrorState`: retry and human-readable API failure state.
- `ConfirmDialog`: confirmation before destructive actions.
- `ImageWithFallback`: handles missing, object-valued, invalid, or failed image URLs.

## 7. Proposed Directory Structure

```text
frontend/
  index.html
  assets/
    fonts/
    icons/
    images/
  src/
    css/
      global.css
      components.css
    js/
      app.js
      router/
        router.js
        routes.js
      services/
        http-client.js
        auth-service.js
        users-service.js
        posts-service.js
        comments-service.js
        tags-service.js
      store/
        auth-store.js
        app-store.js
      components/
        app-shell.js
        header.js
        navigation.js
        post-card.js
        post-list.js
        post-detail.js
        user-card.js
        user-profile.js
        tag-list.js
        tag-badge.js
        comment-list.js
        comment-form.js
        auth-form.js
        pagination.js
        loading-state.js
        empty-state.js
        error-state.js
        confirm-dialog.js
        image-with-fallback.js
      views/
        home-view.js
        post-detail-view.js
        users-view.js
        profile-view.js
        tags-view.js
        login-view.js
        register-view.js
        settings-view.js
        not-found-view.js
      utils/
        api-normalizers.js
        query-params.js
        url.js
        dates.js
        images.js
        validation.js
        escape-html.js
```

The repository currently has `components/`, `router/`, `services/`, and `views/` directories. The proposed `store/` and `utils/` directories are additions to keep state and pure transformations separate from views and API access. CSS may remain in the existing `src/css/` location rather than introducing a separate `styles/` directory.

## 8. Layer Responsibilities and Data Flow

```text
User interaction
      |
      v
Route-level view
      |
      v
Resource service
      |
      v
Shared HTTP client
      |
      v
Tarmeez API
```

### Bootstrap

`app.js` creates the router, initializes the auth store, mounts `AppShell`, and triggers the initial route render.

### Router

`router/router.js` and `router/routes.js` own:

- History API navigation.
- Link interception for internal `data-link` anchors.
- Route matching and path parameter extraction.
- Rendering the correct view.
- Dispatching the not-found view.
- Re-rendering on browser back and forward.

### Views

Views orchestrate a route. They read route parameters, request data through resource services, update application state, and compose components. Views own loading, empty, error, and retry behavior for their route.

### Services

Resource services own endpoint paths and resource-specific payload construction. They return normalized domain models or structured errors to views. They do not manipulate DOM.

### HTTP client

`http-client.js` owns:

- Base URL joining.
- `Accept` and body headers.
- Bearer token injection.
- JSON request serialization.
- `FormData` handling.
- Empty response handling.
- JSON parsing.
- HTTP status classification.
- Normalized API errors.

### Stores

- `auth-store.js`: token, authenticated user snapshot if available, login/logout state, and local persistence.
- `app-store.js`: request state and transient UI state where a shared store is useful.

Persist only the minimum session data needed by the browser. The actual token field cannot be selected until the login response is verified.

## 9. Authentication and Security Rules

- Treat register and login as public requests.
- Attach `Authorization: Bearer <token>` only when a token exists and the endpoint requires it.
- Never log passwords, access tokens, or complete credential payloads.
- Clear local auth state on logout and on a confirmed 401 response.
- Redirect protected actions to `/login` when no token is available.
- Represent 401, 403, 404, 422, 429, and 5xx errors distinctly when the API provides those statuses.
- Use `URLSearchParams` for page numbers and future query filters.
- Escape user-controlled text before inserting it into the DOM. Prefer `textContent` and DOM APIs over unsafe `innerHTML`.
- Avoid trusting API URLs blindly. Validate image values and use a fallback when the value is missing, an object, malformed, or fails to load.
- Do not store passwords.
- Treat ownership checks as server-side authorization. Client-side controls only improve presentation and are not security boundaries.

## 10. Loading, Error, and Mutation Behavior

Every data view should provide explicit states:

1. Loading while the request is pending.
2. Content when data is available.
3. Empty state when a successful list contains no records.
4. Retryable error state for network failures and 5xx responses.
5. Authentication prompt for 401 responses.
6. Permission message for 403 responses.
7. Not-found message for 404 responses.
8. Validation feedback for 422 responses.
9. Rate-limit feedback for 429 responses.

Destructive post and comment actions should require confirmation. After a successful delete, update the relevant view by refetching or removing the deleted item from the local view state. Avoid optimistic mutation until the API's mutation responses and failure semantics are verified.

## 11. Open Questions and Verification Checklist

Before implementing the service methods and mutation forms, verify:

- The successful `POST /login` response body and exact token field.
- Whether login returns a user object as well as a token.
- The successful `POST /register` response and whether it creates a session.
- Exact success status codes and bodies for register, login, logout, post creation, post deletion, comment creation, and comment deletion.
- Whether logout requires a body or only the bearer token.
- Whether comments require JSON or multipart/form-data.
- Exact `POST /posts` field names, required fields, image behavior, and tag representation.
- Whether `PUT` or `PATCH` post updates are supported.
- Which post query filters are supported and how they are named.
- Whether standalone `GET /posts/{postId}/comments` is intentionally unsupported or temporarily failing.
- Whether `/tags/{tag}` is unsupported and whether tag navigation should instead use a post filter.
- Validation error shapes and the API's behavior for 401, 403, 404, 422, 429, and 500 responses.
- CORS behavior when the browser calls the remote API directly.

## 12. Explicitly Deferred Features

The first implementation plan excludes the following until their API contracts are verified:

- Profile editing.
- Tag-detail pages based on `GET /tags/{tag}`.
- A standalone comments page or dependency on `GET /posts/{postId}/comments`.
- Post update forms using PUT or PATCH.
- Unverified post filtering controls.
- An optimistic mutation/cache layer.
- An Express API proxy, unless direct browser requests fail due to CORS.

## 13. Existing Project Integration

The architecture fits the current project as follows:

- `server.js` continues serving static assets and the SPA fallback.
- `frontend/index.html` remains the module entry point.
- `frontend/src/js/app.js` becomes the application bootstrap.
- `frontend/src/js/router/router.js` owns client-side navigation.
- `frontend/src/js/services/` owns API access.
- `frontend/src/js/components/` owns reusable DOM UI.
- `frontend/src/js/views/` owns route-level orchestration.
- `package.json` currently contains Express only and does not require a frontend framework or additional dependency for this architecture.

This separation keeps API details out of presentation code and leaves the application ready for incremental implementation once the unresolved API contracts have been tested.
