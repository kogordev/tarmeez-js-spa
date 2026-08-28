import escapeHtml from "/src/js/utils/escape-html.js"
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

export function renderPostCard(post = {}, { onSelect, isDetailView = false } = {}) {
    const article = document.createElement("article")
    const author = post.author || {}
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

    if (authorLink.href) authorInfo.append(authorLink)
    else authorInfo.append(authorImage, authorName)
    footer.append(comments)
    if (!isDetailView) footer.append(detailLink)
    article.append(authorInfo, timestamp, title, body, postImage, tags, footer)
    return article
}

export default renderPostCard
