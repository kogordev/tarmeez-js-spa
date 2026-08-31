import { renderErrorState } from "/js/components/error-state.js"
import { renderLoadingState } from "/js/components/loading-state.js"
import { renderPostList } from "/js/components/post-list.js"
import { renderPostCard } from "/js/components/post-card.js"
import { renderCreatePostCard } from "/js/components/create-post-card.js"
import { renderCreatePostModal } from "/js/components/create-post-modal.js"
import postsService from "/js/services/posts-service.js"
import usersService from "/js/services/users-service.js"
import authStore from "/js/store/auth-store.js"

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
    const isOwnProfile = authStore.isAuthenticated() && String(authStore.getUser()?.id) === String(userId)
    let createPostCard = null
    let isEditing = false
    const editModal = renderCreatePostModal({
        postService,
        service: postService,
        onSuccess: (post) => {
            if (!isEditing && post) {
                handleCreate(post)
                return
            }
            load()
        }
    })
    function openEditModal(post) {
        isEditing = Boolean(post)
        editModal.open(post)
    }
    if (isOwnProfile) {
        createPostCard = renderCreatePostCard({ onOpen: () => openEditModal() })
    }

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

    function handleCreate(post) {
        postsCount += 1
        updateCounter()
        const card = renderPostCard(post, {
            onSelect: (item) => navigate(`#/posts/${item.id}`),
            onEdit: (item) => openEditModal(item),
            onDelete: () => handleDelete()
        })
        if (!postsContainer) return
        const isEmptyContainer = postsContainer.classList.contains("user-posts__empty")
        const hasEmptyChild = postsContainer.querySelector(".user-posts__empty")
        if (isEmptyContainer) {
            const list = renderPostList([])
            list.append(card)
            postsContainer.replaceWith(list)
            postsContainer = list
        } else if (hasEmptyChild) {
            postsContainer.replaceChildren(card)
        } else {
            postsContainer.prepend(card)
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
                    onEdit: (post) => openEditModal(post),
                    onDelete: () => handleDelete()
                })
                : renderEmptyPostsState()
            const content = document.createDocumentFragment()
            content.append(heading, details)
            if (createPostCard) content.append(createPostCard)
            content.append(postsContainer, editModal)
            container.replaceChildren(content)
        })
    }
    load()
    return () => { active = false }
}

export default renderUserProfileView