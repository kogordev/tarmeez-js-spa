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

export function renderProfileHeader(user = {}, { onEdit } = {}) {
    const card = document.createElement("section")
    card.className = "profile-card"

    const user_ = document.createElement("div")
    user_.className = "profile-card__user"

    const avatar = document.createElement("img")
    avatar.className = "profile-card__avatar"
    avatar.src = getImageUrl(user.profileImageUrl, DEFAULT_AVATAR_FALLBACK)
    avatar.alt = user.name || user.username || "User avatar"
    avatar.addEventListener("error", (event) => setImageFallback(event, "avatar"))

    const info = document.createElement("div")
    info.className = "profile-card__info"

    const name = document.createElement("h1")
    name.className = "profile-card__name"
    name.textContent = user.name || user.username || "User profile"

    const meta = document.createElement("div")
    meta.className = "profile-card__meta d-inline-flex align-items-center gap-2"

    const handle = document.createElement("span")
    handle.className = "profile-card__handle text-muted"
    handle.textContent = `@${user.username || ""}`

    const separator = document.createElement("span")
    separator.className = "text-muted opacity-50"
    separator.textContent = "•"

    const email = document.createElement("span")
    email.className = "profile-email text-muted d-inline-flex align-items-center gap-1"
    const emailIcon = document.createElement("i")
    emailIcon.className = "bi bi-envelope opacity-75"
    const emailText = document.createElement("span")
    emailText.id = "profile-email-text"
    emailText.textContent = user.email || "No email provided"
    email.append(emailIcon, emailText)

    meta.append(handle, separator, email)

    const stats = document.createElement("div")
    stats.className = "profile-card__stats mt-2"
    stats.innerHTML = `
        <span class="profile-card__stat">${user.postsCount || 0} posts</span>
        <span class="profile-card__stat">${user.commentsCount || 0} comments</span>
    `

    info.append(name, meta, stats)
    user_.append(avatar, info)
    card.append(user_)

    if (onEdit) {
        const actions = document.createElement("div")
        actions.className = "profile-card__actions"

        const editButton = document.createElement("button")
        editButton.type = "button"
        editButton.className = "profile-card__edit-button"
        editButton.textContent = "Edit Profile"
        editButton.addEventListener("click", () => onEdit())

        actions.append(editButton)
        card.append(actions)
    }

    return card
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
    let profileHeader = null
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
    const editProfileModal = renderEditProfileModal()
    function openEditModal(post) {
        isEditing = Boolean(post)
        editModal.open(post)
    }
    if (isOwnProfile) {
        createPostCard = renderCreatePostCard({ onOpen: () => openEditModal() })
    }

    function updateCounter() {
        const stat = profileHeader?.querySelector(".profile-card__stat")
        if (stat) {
            stat.textContent = `${postsCount} posts`
        }
    }

    function syncProfileHeader(user) {
        if (!profileHeader || !user) return
        const name = profileHeader.querySelector(".profile-card__name")
        const handle = profileHeader.querySelector(".profile-card__handle")
        const emailText = profileHeader.querySelector("#profile-email-text")
        const avatar = profileHeader.querySelector(".profile-card__avatar")
        if (name) name.textContent = user.name || user.username || "User profile"
        if (handle) handle.textContent = `@${user.username || ""}`
        if (emailText) emailText.textContent = user.email || "No email provided"
        if (avatar && user.profileImageUrl) {
            delete avatar.dataset.fallbackApplied
            avatar.src = getImageUrl(user.profileImageUrl, DEFAULT_AVATAR_FALLBACK)
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
            profileHeader = renderProfileHeader(user, { onEdit: isOwnProfile ? () => editProfileModal.open(user, syncProfileHeader) : undefined })
            const sortedPosts = sortByNewest(postsResponse.data.items)
            postsContainer = sortedPosts.length
                ? renderPostList(sortedPosts, {
                    onSelect: (post) => navigate(`#/posts/${post.id}`),
                    onEdit: (post) => openEditModal(post),
                    onDelete: () => handleDelete()
                })
                : renderEmptyPostsState()
            const content = document.createDocumentFragment()
            content.append(profileHeader)
            if (createPostCard) content.append(createPostCard)
            content.append(postsContainer, editModal, editProfileModal)
            container.replaceChildren(content)
        })
    }
    load()
    return () => { active = false }
}

export default renderUserProfileView