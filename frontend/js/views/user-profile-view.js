import { renderErrorState } from "/js/components/error-state.js"
import { renderLoadingState } from "/js/components/loading-state.js"
import { renderPostList } from "/js/components/post-list.js"
import { renderPostCard } from "/js/components/post-card.js"
import { renderCreatePostCard } from "/js/components/create-post-card.js"
import { renderCreatePostModal } from "/js/components/create-post-modal.js"
import { renderEditProfileModal } from "/js/components/edit-profile-modal.js"
import postsService from "/js/services/posts-service.js"
import usersService from "/js/services/users-service.js"
import authStore from "/js/store/auth-store.js"
import { DEFAULT_AVATAR_FALLBACK, getImageUrl, setImageFallback } from "/js/utils/images.js"

function messageFor(response) { return response?.error?.message || "Unable to load this profile." }

function renderProfileHeader(user, { onEdit } = {}) {
    const header = document.createElement("div")
    header.className = "user-profile-header"

    const avatar = document.createElement("img")
    avatar.className = "user-profile-header__avatar"
    avatar.alt = `${user.name || user.username || "User"} profile image`
    avatar.src = getImageUrl(user.profileImageUrl, DEFAULT_AVATAR_FALLBACK)
    avatar.addEventListener("error", (event) => setImageFallback(event, "avatar"))

    const info = document.createElement("div")
    info.className = "user-profile-header__info"

    const name = document.createElement("h1")
    name.className = "user-profile-header__name"
    name.textContent = user.name || user.username || "User profile"

    const usernameTag = document.createElement("p")
    usernameTag.className = "user-profile-header__username"
    usernameTag.textContent = user.username ? `@${user.username}` : ""

    const badge = document.createElement("span")
    badge.className = "user-profile-header__badge"

    info.append(name, usernameTag, badge)
    header.append(avatar, info)

    const isOwner = authStore.getUser()?.id === user.id
    if (isOwner) {
        const editButton = document.createElement("button")
        editButton.type = "button"
        editButton.className = "user-profile-header__edit-btn"
        editButton.textContent = "Edit Profile"
        editButton.addEventListener("click", () => onEdit?.())
        header.append(editButton)
    }

    return { header, badge, nameEl: name, usernameEl: usernameTag }
}

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
    let postsCount = 0
    let badge = null
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

    let nameEl = null
    let usernameEl = null
    const editProfileModal = renderEditProfileModal({
        onSuccess: (data) => {
            const updatedUser = data?.user
            if (!updatedUser) return
            if (nameEl) nameEl.textContent = updatedUser.name || updatedUser.username || "User profile"
            if (usernameEl) usernameEl.textContent = updatedUser.username ? `@${updatedUser.username}` : ""
        }
    })

    function updateCounter() {
        if (badge) {
            badge.textContent = `${postsCount} post${postsCount === 1 ? "" : "s"}`
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
            postsCount = user.postsCount ?? postsResponse.data.items.length
            const { header, badge: headerBadge, nameEl: headerNameEl, usernameEl: headerUsernameEl } = renderProfileHeader(user, {
                onEdit: () => editProfileModal.open(authStore.getUser())
            })
            badge = headerBadge
            nameEl = headerNameEl
            usernameEl = headerUsernameEl
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
            content.append(header)
            if (createPostCard) content.append(createPostCard)
            content.append(postsContainer, editModal, editProfileModal)
            container.replaceChildren(content)
        })
    }
    load()
    return () => { active = false }
}

export default renderUserProfileView