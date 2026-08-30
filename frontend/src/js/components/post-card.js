import escapeHtml, { autolinkText } from "/src/js/utils/escape-html.js"
import authStore from "/src/js/store/auth-store.js"
import { deletePost } from "/src/js/services/posts-service.js"
import { DEFAULT_AVATAR_FALLBACK, getImageUrl, hasValidImage, setImageFallback } from "/src/js/utils/images.js"
import { renderConfirmModal } from "/src/js/components/confirm-modal.js"
import { openImageModal } from "/src/js/components/image-modal.js"

let activeMenuClose = null

function setSafeText(element, value) {
    element.innerHTML = escapeHtml(value)
}

function setAutolinkedText(element, value) {
    element.innerHTML = autolinkText(value)
}

function formatTimestamp(value) {
    if (!value) {
        return ""
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return String(value)
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date)
}

function getAuthorLabel(author) {
    return author?.name || author?.username || "Unknown author"
}

export function renderPostCard(post = {}, { onSelect, onEdit, onDelete, isDetailView = false } = {}) {
    const article = document.createElement("article")
    const author = post.author || {}
    let currentUser = authStore.getUser ? authStore.getUser() : null

    if (!currentUser && typeof window !== "undefined" && window.localStorage) {
        try {
            const savedState = JSON.parse(window.localStorage.getItem("tarmeez.auth") || "null")
            currentUser = savedState?.user || null
        } catch {
            currentUser = null
        }
    }

    const isOwnedPost = Boolean(
        currentUser &&
        author &&
        [currentUser.id, currentUser.userId, currentUser._id]
            .filter((value) => value !== undefined && value !== null && value !== "")
            .some((value) => String(value) === String(author.id))
    )
    const header = document.createElement("div")
    const authorLink = document.createElement("a")
    const authorImage = document.createElement("img")
    const authorInfo = document.createElement("div")
    const authorName = document.createElement("span")
    const timestamp = document.createElement("time")
    const title = document.createElement("h2")
    const body = document.createElement("p")
    const postImage = document.createElement("img")
    const tags = document.createElement("ul")
    const footer = document.createElement("div")
    const comments = document.createElement("span")
    const detailLink = document.createElement("a")

    article.className = "post-card"
    article.setAttribute("dir", "auto")
    if (post.id !== undefined && post.id !== null) {
        article.dataset.postId = String(post.id)
    }
    header.className = "post-card__header"
    header.style.display = "flex"
    header.style.alignItems = "flex-start"
    header.style.justifyContent = "space-between"
    header.style.gap = "12px"
    authorInfo.className = "post-card__author"
    authorImage.className = "post-card__author-image"
    authorImage.alt = `${getAuthorLabel(author)} profile image`
    authorImage.addEventListener("error", (event) => setImageFallback(event, "avatar"))
    authorImage.src = getImageUrl(author.profileImageUrl, DEFAULT_AVATAR_FALLBACK)
    authorName.className = "post-card__author-name"
    setSafeText(authorName, getAuthorLabel(author))
    authorLink.className = "post-card__author-link"
    if (author.id !== undefined && author.id !== null) {
        authorLink.href = `/users/${encodeURIComponent(author.id)}`
        authorLink.dataset.link = ""
        authorLink.append(authorImage, authorName)
    }
    timestamp.className = "post-card__timestamp"
    timestamp.dateTime = post.createdAt || ""
    setSafeText(timestamp, formatTimestamp(post.createdAt))
    title.className = "post-card__title"
    title.setAttribute("dir", "auto")
    const titleLink = document.createElement("a")
    titleLink.href = `/post/${encodeURIComponent(post.id)}`
    titleLink.dataset.link = ""
    titleLink.setAttribute("dir", "auto")
    setSafeText(titleLink, post.title || "Untitled post")
    title.append(titleLink)
    body.className = "post-card__body"
    body.setAttribute("dir", "auto")
    setAutolinkedText(body, post.body || "")
    postImage.className = "post-card__image"
    postImage.alt = post.title ? `${post.title} image` : "Post image"
    postImage.addEventListener("click", (event) => {
        event.stopPropagation()
        openImageModal(postImage.currentSrc || postImage.src, postImage.alt)
    })
    postImage.addEventListener("error", setImageFallback)
    if (hasValidImage(post.imageUrl)) {
        postImage.src = getImageUrl(post.imageUrl)
    } else {
        setImageFallback(postImage)
    }
    tags.className = "post-card__tags"
    footer.className = "post-card__footer"
    comments.className = "post-card__comments"
    setSafeText(comments, `Comments: ${post.commentsCount ?? post.comments_count ?? 0}`)
    detailLink.className = "post-card__detail-link"
    detailLink.href = `/post/${encodeURIComponent(post.id)}`
    detailLink.dataset.link = ""
    setSafeText(detailLink, "Read more / comments")

    ;(Array.isArray(post.tags) ? post.tags : []).forEach((tag) => {
        const item = document.createElement("li")
        item.className = "post-card__tag"
        setSafeText(item, tag?.name || tag?.arabicName || "")
        tags.append(item)
    })

    if (onSelect) {
        article.tabIndex = 0
        article.addEventListener("click", (event) => {
            if (event.target.closest("a, button")) return
            onSelect(post)
        })
        article.addEventListener("keydown", (event) => {
            if (event.target.closest("a, button")) return
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onSelect(post)
            }
        })
    }

    const menuWrapper = document.createElement("div")
    menuWrapper.style.position = "relative"
    menuWrapper.style.marginLeft = "auto"

    if (isOwnedPost) {
        const menuButton = document.createElement("button")
        const menu = document.createElement("div")
        const editAction = document.createElement("button")
        const deleteAction = document.createElement("button")
        const confirmModal = renderConfirmModal({
            title: "Delete post?",
            message: "This post and its comments will be removed permanently.",
            onConfirm: async ({ close, fail }) => {
                const response = await deletePost(post.id)
                if (!response?.ok) {
                    confirmModal.setMessage(response?.error?.message || "Unable to delete this post.")
                    fail()
                    return
                }

                article.remove()
                onDelete?.(post)
                close()
            }
        })

        const closeMenu = () => {
            menu.hidden = true
            menuButton.setAttribute("aria-expanded", "false")
            if (activeMenuClose === closeMenu) {
                activeMenuClose = null
            }
        }

        menuButton.type = "button"
        menuButton.className = "post-card__menu-button"
        menuButton.textContent = "..."
        menuButton.setAttribute("aria-label", "Post actions")
        menuButton.setAttribute("aria-expanded", "false")

        menu.className = "post-card__menu"
        menu.hidden = true

        ;[editAction, deleteAction].forEach((actionButton) => {
            actionButton.type = "button"
            actionButton.className = "post-card__menu-action"
        })

        editAction.textContent = "Edit Post"
        deleteAction.textContent = "Delete Post"

        editAction.addEventListener("click", (event) => {
            event.preventDefault()
            event.stopPropagation()
            closeMenu()
            onEdit?.(post)
        })

        deleteAction.addEventListener("click", (event) => {
            event.preventDefault()
            event.stopPropagation()

            if (!post?.id) {
                return
            }

            closeMenu()
            confirmModal.setMessage("This post and its comments will be removed permanently.")
            confirmModal.open()
        })

        menuButton.addEventListener("click", (event) => {
            event.preventDefault()
            event.stopPropagation()
            const isOpen = !menu.hidden
            if (isOpen) {
                closeMenu()
                return
            }

            activeMenuClose?.()
            menu.hidden = false
            menuButton.setAttribute("aria-expanded", "true")
            activeMenuClose = closeMenu
        })

        document.addEventListener("click", (event) => {
            if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
                closeMenu()
            }
        })

        menu.append(editAction, deleteAction)
        menuWrapper.append(menuButton, menu)
    }

    if (authorLink.href) authorInfo.append(authorLink)
    else authorInfo.append(authorImage, authorName)
    footer.append(comments)
    if (!isDetailView) footer.append(detailLink)
    header.append(authorInfo)
    if (isOwnedPost) header.append(menuWrapper)
    article.append(header, timestamp, title, body, postImage, tags, footer)
    return article
}

export default renderPostCard
