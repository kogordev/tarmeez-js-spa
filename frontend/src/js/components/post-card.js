import escapeHtml from "/src/js/utils/escape-html.js"
import authStore from "/src/js/store/auth-store.js"
import { deletePost } from "/src/js/services/posts-service.js"
import { DEFAULT_AVATAR_FALLBACK, getImageUrl, hasValidImage, setImageFallback } from "/src/js/utils/images.js"

function setSafeText(element, value) {
    element.innerHTML = escapeHtml(value)
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

export function renderPostCard(post = {}, { onSelect, onEdit, isDetailView = false } = {}) {
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
    const titleLink = document.createElement("a")
    titleLink.href = `/post/${encodeURIComponent(post.id)}`
    titleLink.dataset.link = ""
    setSafeText(titleLink, post.title || "Untitled post")
    title.append(titleLink)
    body.className = "post-card__body"
    setSafeText(body, post.body || "")
    postImage.className = "post-card__image"
    postImage.alt = post.title ? `${post.title} image` : "Post image"
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

        const closeMenu = () => {
            menu.hidden = true
            menuButton.setAttribute("aria-expanded", "false")
        }

        menuButton.type = "button"
        menuButton.className = "post-card__menu-button"
        menuButton.textContent = "..."
        menuButton.setAttribute("aria-label", "Post actions")
        menuButton.setAttribute("aria-expanded", "false")
        menuButton.style.background = "transparent"
        menuButton.style.border = "none"
        menuButton.style.color = "#4b5563"
        menuButton.style.cursor = "pointer"
        menuButton.style.fontSize = "1.5rem"
        menuButton.style.lineHeight = "1"
        menuButton.style.padding = "4px 8px"
        menuButton.style.borderRadius = "6px"
        menuButton.style.alignSelf = "flex-start"

        menu.className = "post-card__menu"
        menu.hidden = true
        menu.style.position = "absolute"
        menu.style.top = "calc(100% + 8px)"
        menu.style.right = "0"
        menu.style.minWidth = "160px"
        menu.style.background = "#fff"
        menu.style.border = "1px solid #e5e7eb"
        menu.style.borderRadius = "8px"
        menu.style.boxShadow = "0 12px 24px rgba(15, 23, 42, 0.12)"
        menu.style.zIndex = "10"
        menu.style.display = "flex"
        menu.style.flexDirection = "column"
        menu.style.padding = "8px 0"

        ;[editAction, deleteAction].forEach((actionButton) => {
            actionButton.type = "button"
            actionButton.style.background = "transparent"
            actionButton.style.border = "none"
            actionButton.style.textAlign = "left"
            actionButton.style.padding = "10px 16px"
            actionButton.style.cursor = "pointer"
            actionButton.style.fontSize = "0.95rem"
            actionButton.style.color = "#111827"
            actionButton.style.width = "100%"
        })

        editAction.textContent = "Edit Post"
        deleteAction.textContent = "Delete Post"

        editAction.addEventListener("click", (event) => {
            event.preventDefault()
            event.stopPropagation()
            closeMenu()
            onEdit?.(post)
        })

        deleteAction.addEventListener("click", async (event) => {
            event.preventDefault()
            event.stopPropagation()

            if (!post?.id) {
                return
            }

            if (!window.confirm("Are you sure you want to delete this post?")) {
                closeMenu()
                return
            }

            closeMenu()

            const response = await deletePost(post.id)
            if (!response?.ok) {
                window.alert(response?.error?.message || "Unable to delete this post.")
                return
            }

            article.remove()
        })

        menuButton.addEventListener("click", (event) => {
            event.preventDefault()
            event.stopPropagation()
            const isOpen = !menu.hidden
            if (isOpen) {
                closeMenu()
                return
            }

            menu.hidden = false
            menuButton.setAttribute("aria-expanded", "true")
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
