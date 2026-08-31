import { renderErrorState } from "/js/components/error-state.js"
import { renderLoadingState } from "/js/components/loading-state.js"
import { renderPostList } from "/js/components/post-list.js"
import { renderCreatePostModal } from "/js/components/create-post-modal.js"
import postsService from "/js/services/posts-service.js"
import usersService from "/js/services/users-service.js"

function messageFor(response) { return response?.error?.message || "Unable to load this profile." }

function sortByNewest(posts) {
    return [...posts].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
}

function renderEmptyPostsState() {
    const empty = document.createElement("div")
    empty.className = "user-posts__empty"
    empty.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <h3>No posts yet</h3>
        <p>This user hasn't published any posts.</p>
    `
    return empty
}

export function renderUserProfileView(container, { userId, navigate, userService = usersService, postService = postsService } = {}) {
    let active = true
    let username = ""
    let postsCount = 0
    let details = null
    let postsContainer = null
    const editModal = renderCreatePostModal({
        postService,
        service: postService,
        onSuccess: () => load()
    })

    function updateCounter() {
        if (details) {
            details.textContent = `@${username} | ${postsCount} posts`
        }
    }

    function handleDelete() {
        postsCount = Math.max(0, postsCount - 1)
        updateCounter()
        if (postsCount === 0 && postsContainer) {
            postsContainer.replaceChildren(renderEmptyPostsState())
        }
    }

    container.replaceChildren(renderLoadingState("Loading profile..."))
    function load() {
        return Promise.all([userService.getUser(userId), postService.getUserPosts(userId)])
        .then(([userResponse, postsResponse]) => {
            if (!active) return
            if (!userResponse.ok || !postsResponse.ok) {
                const failed = !userResponse.ok ? userResponse : postsResponse
                container.replaceChildren(renderErrorState(messageFor(failed)))
                return
            }
            const user = userResponse.data
            username = user.username
            postsCount = user.postsCount ?? postsResponse.data.items.length
            const heading = document.createElement("h1")
            heading.textContent = user.name || user.username || "User profile"
            details = document.createElement("p")
            updateCounter()
            const sortedPosts = sortByNewest(postsResponse.data.items)
            postsContainer = sortedPosts.length
                ? renderPostList(sortedPosts, {
                    onSelect: (post) => navigate(`#/posts/${post.id}`),
                    onEdit: (post) => editModal.open(post),
                    onDelete: () => handleDelete()
                })
                : renderEmptyPostsState()
            container.replaceChildren(
                heading,
                details,
                postsContainer,
                editModal
            )
        })
    }
    load()
    return () => { active = false }
}

export default renderUserProfileView